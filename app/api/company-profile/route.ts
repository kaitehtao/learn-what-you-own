import { env } from "cloudflare:workers";
import { ensureCompanyProfileSchema } from "../../../db/runtimeSchema";

export const dynamic = "force-dynamic";

type ContactRow = {
  legal_name:string;street_1:string;street_2:string;city:string;state_or_country:string;postal_code:string;
  telephone:string;company_website_url:string;investor_relations_url:string;investor_relations_email:string;
  investor_relations_phone:string;sec_source_url:string;ir_source_url:string;verified_at:string;
};
type PersonRow = { name:string;title:string;biography:string;source_url:string;source_excerpt:string;source_filing_date:string|null;verified_at:string };

export async function GET(request: Request) {
  const ticker = (new URL(request.url).searchParams.get("ticker") || "").trim().toUpperCase();
  if (!/^[A-Z0-9.-]{1,15}$/.test(ticker)) return Response.json({ error: "A valid ticker is required." }, { status: 400 });
  try {
    await ensureCompanyProfileSchema();
    const [contact, management] = await Promise.all([
      env.DB.prepare(`SELECT legal_name,street_1,street_2,city,state_or_country,postal_code,telephone,company_website_url,
        investor_relations_url,investor_relations_email,investor_relations_phone,sec_source_url,ir_source_url,verified_at
        FROM company_contact_profiles WHERE ticker=?`).bind(ticker).first<ContactRow>(),
      env.DB.prepare(`SELECT name,title,biography,source_url,source_excerpt,source_filing_date,verified_at
        FROM company_management_people WHERE ticker=? AND is_current=1 ORDER BY id LIMIT 12`).bind(ticker).all<PersonRow>(),
    ]);
    return Response.json({ ticker, contact: contact ?? null, management: management.results }, {
      headers: { "cache-control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch (error) {
    console.error(`Unable to load company profile for ${ticker}.`, error);
    return Response.json({ error: "Company profile is temporarily unavailable." }, { status: 503 });
  }
}
