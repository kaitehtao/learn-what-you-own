import { refreshNextCompanyProfile } from "../../../data/companyProfileRefresh";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const expected = process.env.NOTIFICATION_CRON_SECRET;
  if (!expected || request.headers.get("authorization") !== `Bearer ${expected}`) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return Response.json(await refreshNextCompanyProfile(), { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("Company profile refresh failed.", error);
    return Response.json({ error: error instanceof Error ? error.message : "Company profile refresh failed." }, { status: 500 });
  }
}
