import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { emergingCompanyDossiers } from "../../../../db/schema";
import { getSupabaseAdminClient } from "../../../supabase-server";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const id = (await context.params).id;
  const db = getDb();
  const [dossier] = await db.select().from(emergingCompanyDossiers)
    .where(eq(emergingCompanyDossiers.supabaseContributionId, id)).limit(1);
  if (!dossier?.roadshowStoragePath) return Response.json({ error: "Approved roadshow material was not found." }, { status: 404 });
  const { data, error } = await getSupabaseAdminClient().storage.from("roadshow-materials")
    .createSignedUrl(dossier.roadshowStoragePath, 300, { download: dossier.roadshowTitle ?? `${dossier.companyName} roadshow.pdf` });
  if (error || !data?.signedUrl) return Response.json({ error: "Roadshow material is temporarily unavailable." }, { status: 503 });
  return Response.redirect(data.signedUrl, 302);
}
