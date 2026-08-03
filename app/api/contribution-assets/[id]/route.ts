import { CONTRIBUTION_RESEARCH_BUCKET } from "../../../contribution-research-assets";
import { getSupabaseAdminClient } from "../../../supabase-server";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const id = Number((await context.params).id);
  if (!Number.isInteger(id)) return Response.json({ error: "Research asset was not found." }, { status: 404 });
  const admin = getSupabaseAdminClient();
  const { data: contribution } = await admin.from("contributions")
    .select("status,research_asset_storage_path,research_asset_file_name")
    .eq("id", id).maybeSingle();
  if (!contribution || contribution.status !== "approved" || !contribution.research_asset_storage_path) {
    return Response.json({ error: "Approved research asset was not found." }, { status: 404 });
  }
  const { data, error } = await admin.storage.from(CONTRIBUTION_RESEARCH_BUCKET).createSignedUrl(
    contribution.research_asset_storage_path,
    300,
    { download: contribution.research_asset_file_name ?? "community-research" },
  );
  if (error || !data?.signedUrl) return Response.json({ error: "Research asset is temporarily unavailable." }, { status: 503 });
  return Response.redirect(data.signedUrl, 302);
}
