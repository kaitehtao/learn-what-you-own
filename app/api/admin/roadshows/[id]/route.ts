import { getSupabaseAdminClient, requireEditor } from "../../../../supabase-server";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  await requireEditor(request);
  const id = Number((await context.params).id);
  if (!Number.isInteger(id)) return Response.json({ error: "Roadshow material was not found." }, { status: 404 });
  const admin = getSupabaseAdminClient();
  const { data: contribution } = await admin.from("contributions").select("roadshow_storage_path,roadshow_title,proposed_company_name").eq("id", id).single();
  if (!contribution?.roadshow_storage_path) return Response.json({ error: "Roadshow material was not found." }, { status: 404 });
  const { data, error } = await admin.storage.from("roadshow-materials").createSignedUrl(
    contribution.roadshow_storage_path,
    300,
    { download: contribution.roadshow_title ?? `${contribution.proposed_company_name ?? "IPO"} roadshow.pdf` },
  );
  if (error || !data?.signedUrl) return Response.json({ error: "Roadshow material is temporarily unavailable." }, { status: 503 });
  return Response.redirect(data.signedUrl, 302);
}
