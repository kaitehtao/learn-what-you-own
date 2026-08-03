import {
  CONTRIBUTION_RESEARCH_BUCKET,
  MAX_CONTRIBUTION_ASSET_BYTES,
  contributionAssetDescriptor,
  type ContributionAssetType,
} from "../../../contribution-research-assets";
import { apiError, getSupabaseAdminClient, requireSupabaseUser } from "../../../supabase-server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { user } = await requireSupabaseUser(request);
    const form = await request.formData();
    const file = form.get("file");
    const assetType = String(form.get("assetType") ?? "") as ContributionAssetType;
    if (!assetType || !["earnings_model", "research_report"].includes(assetType)) {
      return Response.json({ error: "Choose an earnings model or research report." }, { status: 400 });
    }
    if (!(file instanceof File)) return Response.json({ error: "Choose a file to upload." }, { status: 400 });
    if (file.size < 1 || file.size > MAX_CONTRIBUTION_ASSET_BYTES) {
      return Response.json({ error: "Contribution files must be 20 MB or smaller." }, { status: 413 });
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    const descriptor = contributionAssetDescriptor(file, assetType, bytes);
    if (!descriptor) {
      return Response.json({
        error: assetType === "research_report"
          ? "Research reports must be valid PDF files."
          : "Earnings models must be valid XLSX or CSV files.",
      }, { status: 415 });
    }
    const storagePath = `${user.id}/${crypto.randomUUID()}.${descriptor.extension}`;
    const admin = getSupabaseAdminClient();
    const { error } = await admin.storage.from(CONTRIBUTION_RESEARCH_BUCKET).upload(storagePath, bytes, {
      contentType: descriptor.mimeType,
      cacheControl: "3600",
      upsert: false,
    });
    if (error) throw error;
    return Response.json({
      asset: {
        type: assetType,
        title: descriptor.fileName.replace(/\.(pdf|xlsx|csv)$/i, ""),
        storagePath,
        fileName: descriptor.fileName,
        mimeType: descriptor.mimeType,
        fileSize: file.size,
      },
    }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const { user } = await requireSupabaseUser(request);
    const payload = await request.json() as { storagePath?: string };
    const storagePath = String(payload.storagePath ?? "");
    if (!storagePath.startsWith(`${user.id}/`) || storagePath.includes("..")) {
      return Response.json({ error: "That upload does not belong to this account." }, { status: 403 });
    }
    const { error } = await getSupabaseAdminClient().storage.from(CONTRIBUTION_RESEARCH_BUCKET).remove([storagePath]);
    if (error) throw error;
    return Response.json({ deleted: true });
  } catch (error) {
    return apiError(error);
  }
}
