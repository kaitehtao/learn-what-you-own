import {
  apiError,
  getSupabaseAdminClient,
  PROFILE_PHOTO_BUCKET,
  publicProfilePhotoUrl,
  requireSupabaseUser,
} from "../../../supabase-server";

export const dynamic = "force-dynamic";

const MAX_PHOTO_BYTES = 3 * 1024 * 1024;
const supportedPhotos: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function POST(request: Request) {
  try {
    const { profile, user } = await requireSupabaseUser(request);
    const form = await request.formData();
    const photo = form.get("photo");
    if (!(photo instanceof File)) return Response.json({ error: "Choose a profile photo to upload." }, { status: 400 });
    const extension = supportedPhotos[photo.type];
    if (!extension) return Response.json({ error: "Use a JPG, PNG, or WebP image." }, { status: 415 });
    if (photo.size === 0 || photo.size > MAX_PHOTO_BYTES) {
      return Response.json({ error: "Profile photos must be smaller than 3 MB." }, { status: 413 });
    }

    const admin = getSupabaseAdminClient();
    const avatarPath = `${user.id}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await admin.storage.from(PROFILE_PHOTO_BUCKET).upload(
      avatarPath,
      await photo.arrayBuffer(),
      { contentType: photo.type, cacheControl: "31536000", upsert: false },
    );
    if (uploadError) throw uploadError;

    const { error: updateError } = await admin.from("profiles").update({ avatar_path: avatarPath }).eq("user_id", user.id);
    if (updateError) {
      await admin.storage.from(PROFILE_PHOTO_BUCKET).remove([avatarPath]);
      throw updateError;
    }
    if (profile.avatar_path && profile.avatar_path !== avatarPath) {
      await admin.storage.from(PROFILE_PHOTO_BUCKET).remove([profile.avatar_path]);
    }
    return Response.json({ avatarPath, avatarUrl: publicProfilePhotoUrl(avatarPath) });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const { profile, user } = await requireSupabaseUser(request);
    const admin = getSupabaseAdminClient();
    const { error: updateError } = await admin.from("profiles").update({ avatar_path: null }).eq("user_id", user.id);
    if (updateError) throw updateError;
    if (profile.avatar_path) await admin.storage.from(PROFILE_PHOTO_BUCKET).remove([profile.avatar_path]);
    return Response.json({ removed: true });
  } catch (error) {
    return apiError(error);
  }
}
