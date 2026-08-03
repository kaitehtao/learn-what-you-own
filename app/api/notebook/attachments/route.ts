import { apiError, getSupabaseAdminClient, requireSupabaseUser } from "../../../supabase-server";

export const dynamic = "force-dynamic";

const PRIVATE_RESEARCH_BUCKET = "private-research-files";
const MAX_PDF_BYTES = 20 * 1024 * 1024;

function publicAttachment(row: Record<string, unknown>) {
  return {
    id: row.id,
    notebookId: row.notebook_id,
    fileName: row.file_name,
    mimeType: row.mime_type,
    fileSize: row.file_size,
    createdAt: row.created_at,
  };
}

function safePdfName(value: string) {
  const clean = value.trim().replace(/[^a-zA-Z0-9._() -]/g, "-").replace(/\s+/g, " ").slice(0, 230);
  if (!clean) return "research-document.pdf";
  return clean.toLowerCase().endsWith(".pdf") ? clean : `${clean}.pdf`;
}

function isPdfSignature(bytes: Uint8Array) {
  return bytes.length >= 5
    && bytes[0] === 0x25
    && bytes[1] === 0x50
    && bytes[2] === 0x44
    && bytes[3] === 0x46
    && bytes[4] === 0x2d;
}

export async function POST(request: Request) {
  try {
    const { profile, supabase, user } = await requireSupabaseUser(request);
    const form = await request.formData();
    const notebookId = Number(form.get("notebookId"));
    const file = form.get("file");
    if (!Number.isInteger(notebookId) || notebookId < 1) {
      return Response.json({ error: "Choose a company notebook before uploading a PDF." }, { status: 400 });
    }
    if (!(file instanceof File)) return Response.json({ error: "Choose a PDF to upload." }, { status: 400 });
    if (file.type !== "application/pdf" || !file.name.toLowerCase().endsWith(".pdf")) {
      return Response.json({ error: "Private research attachments must be PDF files." }, { status: 415 });
    }
    if (file.size < 1 || file.size > MAX_PDF_BYTES) {
      return Response.json({ error: "PDFs must be 20 MB or smaller." }, { status: 413 });
    }
    const { data: notebook, error: notebookError } = await supabase.from("research_notebooks").select("id")
      .eq("id", notebookId).eq("user_id", profile.user_id).maybeSingle();
    if (notebookError) throw notebookError;
    if (!notebook) return Response.json({ error: "Company notebook not found." }, { status: 404 });

    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!isPdfSignature(bytes)) return Response.json({ error: "That file does not appear to be a valid PDF." }, { status: 415 });

    const fileName = safePdfName(file.name);
    const storagePath = `${user.id}/${notebookId}/${crypto.randomUUID()}.pdf`;
    const admin = getSupabaseAdminClient();
    const { error: uploadError } = await admin.storage.from(PRIVATE_RESEARCH_BUCKET).upload(
      storagePath,
      bytes,
      { contentType: "application/pdf", cacheControl: "3600", upsert: false },
    );
    if (uploadError) throw uploadError;

    const { data, error } = await supabase.from("research_attachments").insert({
      user_id: profile.user_id,
      notebook_id: notebookId,
      file_name: fileName,
      storage_path: storagePath,
      mime_type: "application/pdf",
      file_size: file.size,
    }).select("*").single();
    if (error) {
      await admin.storage.from(PRIVATE_RESEARCH_BUCKET).remove([storagePath]);
      throw error;
    }
    return Response.json({ attachment: publicAttachment(data) }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const { profile, supabase } = await requireSupabaseUser(request);
    const payload = await request.json() as { id?: number };
    const id = Number(payload.id);
    if (!Number.isInteger(id) || id < 1) return Response.json({ error: "Choose a valid attachment." }, { status: 400 });
    const { data: attachment, error: selectError } = await supabase.from("research_attachments")
      .select("id,storage_path").eq("id", id).eq("user_id", profile.user_id).maybeSingle();
    if (selectError) throw selectError;
    if (!attachment) return Response.json({ error: "Attachment not found." }, { status: 404 });

    const admin = getSupabaseAdminClient();
    const { error: storageError } = await admin.storage.from(PRIVATE_RESEARCH_BUCKET).remove([attachment.storage_path]);
    if (storageError) throw storageError;
    const { error: deleteError } = await supabase.from("research_attachments").delete()
      .eq("id", attachment.id).eq("user_id", profile.user_id);
    if (deleteError) throw deleteError;
    return Response.json({ deleted: true });
  } catch (error) {
    return apiError(error);
  }
}
