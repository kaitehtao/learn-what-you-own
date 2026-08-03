import { apiError, getSupabaseAdminClient, requireSupabaseUser } from "../../../../supabase-server";

export const dynamic = "force-dynamic";

const PRIVATE_RESEARCH_BUCKET = "private-research-files";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { profile, supabase } = await requireSupabaseUser(request);
    const id = Number((await context.params).id);
    if (!Number.isInteger(id) || id < 1) return Response.json({ error: "Attachment not found." }, { status: 404 });
    const { data: attachment, error: selectError } = await supabase.from("research_attachments")
      .select("storage_path,file_name").eq("id", id).eq("user_id", profile.user_id).maybeSingle();
    if (selectError) throw selectError;
    if (!attachment) return Response.json({ error: "Attachment not found." }, { status: 404 });
    const { data, error } = await getSupabaseAdminClient().storage.from(PRIVATE_RESEARCH_BUCKET)
      .createSignedUrl(attachment.storage_path, 120, { download: attachment.file_name });
    if (error || !data?.signedUrl) return Response.json({ error: "Attachment is temporarily unavailable." }, { status: 503 });
    return Response.json({ url: data.signedUrl, fileName: attachment.file_name, expiresIn: 120 });
  } catch (error) {
    return apiError(error);
  }
}
