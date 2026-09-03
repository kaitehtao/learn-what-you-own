import { readFile } from "node:fs/promises";

const config = JSON.parse(await readFile("dist/server/wrangler.json", "utf8"));
const expectedRoutes = new Set(["learnwhatyouown.com/*", "www.learnwhatyouown.com/*"]);
if (config.name !== "learn-what-you-own") throw new Error(`Worker name must be learn-what-you-own, received ${config.name}.`);
if (config.limits?.cpu_ms !== 30_000) throw new Error("Production Worker CPU limit must be 30,000 ms.");
const database = config.d1_databases?.find((binding) => binding.binding === "DB");
if (database?.database_id !== "8c2f7a1b-aa6e-45be-8e89-8c64bb0be557") throw new Error("D1 binding does not match the production database.");
if (!config.routes?.every((route) => expectedRoutes.has(route.pattern)) || config.routes.length !== expectedRoutes.size) throw new Error("Production routes are incomplete or unexpected.");
const crons = new Set(config.triggers?.crons ?? []);
for (const cron of ["0-59/5 * * * *", "1-59/5 * * * *", "2-59/5 * * * *", "3-59/5 * * * *", "4-59/5 * * * *", "*/15 * * * *", "0 0,6,12,18 * * *", "0 15,16 * * *"]) if (!crons.has(cron)) throw new Error(`Missing scheduled trigger: ${cron}`);
const dossierProducer = config.queues?.producers?.find((queue) => queue.binding === "DOSSIER_INGESTION_QUEUE");
if (dossierProducer?.queue !== "lwyo-dossier-ingestion") throw new Error("Dossier ingestion producer queue is missing or incorrect.");
const dossierConsumer = config.queues?.consumers?.find((queue) => queue.queue === "lwyo-dossier-ingestion");
if (!dossierConsumer || dossierConsumer.max_batch_size !== 1 || dossierConsumer.max_concurrency !== 2 || dossierConsumer.dead_letter_queue !== "lwyo-dossier-ingestion-dlq") {
  throw new Error("Dossier ingestion consumer safeguards are incomplete.");
}
console.log("Production Worker configuration is canonical.");
