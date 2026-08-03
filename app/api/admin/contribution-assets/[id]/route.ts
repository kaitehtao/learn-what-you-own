import { CONTRIBUTION_RESEARCH_BUCKET } from "../../../../contribution-research-assets";
import { getSupabaseAdminClient, requireEditor } from "../../../../supabase-server";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  await requireEditor(request);
  const id = Number((await context.params).id);
  if (!Number.isInteger(id)) return Response.json({ error: "Research asset was not found." }, { status: 404 });
  const admin = getSupabaseAdminClient();
  const { data: contribution } = await admin.from("contributions")
    .select("research_asset_storage_path,research_asset_file_name")
    .eq("id", id).maybeSingle();
  if (!contribution?.research_asset_storage_path) return Response.json({ error: "Research asset was not found." }, { status: 404 });
  const { data, error } = await admin.storage.from(CONTRIBUTION_RESEARCH_BUCKET).createSignedUrl(
    contribution.research_asset_storage_path,
    300,
    { download: contribution.research_asset_file_name ?? "community-research" },
  );
  if (error || !data?.signedUrl) return Response.json({ error: "Research asset is temporarily unavailable." }, { status: 503 });
  return Response.json({ url: data.signedUrl });
}
