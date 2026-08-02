import { env } from "cloudflare:workers";
import { brokerageByKey, brokerageDestination, type BrokerageAction, type BrokerageKey } from "../../brokerageDirectory";
import { ensureBrokerageClickSchema } from "../../../db/runtimeSchema";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const key = requestUrl.searchParams.get("broker") ?? "";
  const action = requestUrl.searchParams.get("action") ?? "";
  const brokerage = brokerageByKey(key);
  if (!brokerage || (action !== "login" && action !== "open")) {
    return Response.json({ error: "Unknown brokerage destination." }, { status: 404 });
  }

  const destination = brokerageDestination(key as BrokerageKey, action as BrokerageAction);
  if (!destination) return Response.json({ error: "Unknown brokerage destination." }, { status: 404 });

  try {
    await ensureBrokerageClickSchema();
    await env.DB.prepare(`INSERT INTO brokerage_clicks
      (click_id,broker_key,action,destination_type,source_path)
      VALUES (?,?,?,?,?)`)
      .bind(crypto.randomUUID(), key, action, destination.destinationType, "/portfolio")
      .run();
  } catch (error) {
    // A reporting outage must never trap a member between Learn What You Own
    // and the brokerage destination they deliberately selected.
    console.error("Brokerage click tracking failed", error);
  }

  return new Response(null, {
    status: 302,
    headers: {
      location: destination.url,
      "cache-control": "no-store",
      "referrer-policy": "origin",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}
