import { apiError, getSupabaseAdminClient, requireSupabaseUser } from "../../../supabase-server";

export const dynamic = "force-dynamic";

type StoredFile = { bucket: string; path: string; label: string };

async function signedFiles(files: StoredFile[]) {
  const admin = getSupabaseAdminClient();
  return Promise.all(files.filter((file) => file.path).map(async (file) => {
    const { data, error } = await admin.storage.from(file.bucket).createSignedUrl(file.path, 3600);
    return { ...file, downloadUrl: error ? null : data.signedUrl, expiresInSeconds: error ? null : 3600 };
  }));
}

export async function GET(request: Request) {
  try {
    const { user, profile } = await requireSupabaseUser(request);
    const admin = getSupabaseAdminClient();
    const id = user.id;
    const [watchlist, portfolio, contributions, messages, follows, notebooks, notes, attachments, preferences, notifications, researchVotes, corrections, emailOutbox, accountAudit, deletionRequests] = await Promise.all([
      admin.from("watchlist_items").select("*").eq("user_id", id).order("created_at"),
      admin.from("portfolio_positions").select("*").eq("user_id", id).order("created_at"),
      admin.from("contributions").select("*").eq("user_id", id).order("created_at"),
      admin.from("private_messages").select("*").or(`sender_id.eq.${id},recipient_id.eq.${id}`).order("created_at"),
      admin.from("member_follows").select("*").or(`follower_id.eq.${id},followed_id.eq.${id}`).order("created_at"),
      admin.from("research_notebooks").select("*").eq("user_id", id).order("created_at"),
      admin.from("research_notes").select("*").eq("user_id", id).order("created_at"),
      admin.from("research_attachments").select("*").eq("user_id", id).order("created_at"),
      admin.from("notification_preferences").select("*").eq("user_id", id),
      admin.from("notifications").select("*").eq("user_id", id).order("created_at"),
      admin.from("company_research_votes").select("*").eq("user_id", id),
      admin.from("contribution_corrections").select("*").eq("contributor_id", id).order("created_at"),
      admin.from("email_notification_outbox").select("*").eq("user_id", id).order("created_at"),
      admin.from("admin_account_audit").select("*").or(`actor_id.eq.${id},target_user_id.eq.${id}`).order("created_at"),
      admin.from("account_deletion_requests").select("*").eq("user_id", id).order("requested_at"),
    ]);
    const results = [watchlist, portfolio, contributions, messages, follows, notebooks, notes, attachments, preferences, notifications, researchVotes, corrections, emailOutbox, accountAudit, deletionRequests];
    const failed = results.find((result) => result.error);
    if (failed?.error) throw failed.error;
    const files: StoredFile[] = [
      ...(profile.avatar_path ? [{ bucket: "profile-photos", path: profile.avatar_path, label: "Profile photo" }] : []),
      ...(attachments.data ?? []).map((item) => ({ bucket: "private-research-files", path: item.storage_path, label: item.file_name })),
      ...(contributions.data ?? []).flatMap((item) => [
        ...(item.research_asset_storage_path ? [{ bucket: "contribution-research-assets", path: item.research_asset_storage_path, label: item.research_asset_file_name ?? "Contribution research file" }] : []),
        ...(item.roadshow_storage_path ? [{ bucket: "roadshow-materials", path: item.roadshow_storage_path, label: item.roadshow_title ?? "Roadshow material" }] : []),
      ]),
    ];
    const exportedAt = new Date().toISOString();
    const payload = {
      format: "learn-what-you-own-member-export-v1",
      exportedAt,
      account: { id, email: user.email, createdAt: user.created_at, lastSignInAt: user.last_sign_in_at, profile },
      data: {
        watchlist: watchlist.data ?? [], portfolio: portfolio.data ?? [], contributions: contributions.data ?? [], messages: messages.data ?? [],
        follows: follows.data ?? [], researchNotebooks: notebooks.data ?? [], researchNotes: notes.data ?? [], researchAttachments: attachments.data ?? [],
        notificationPreferences: preferences.data ?? [], notifications: notifications.data ?? [], emailNotificationOutbox: emailOutbox.data ?? [],
        companyResearchVotes: researchVotes.data ?? [], contributionCorrections: corrections.data ?? [], accountAudit: accountAudit.data ?? [], deletionRequests: deletionRequests.data ?? [],
      },
      files: await signedFiles(files),
      fileDownloadNotice: "Private file links expire one hour after this export was created.",
    };
    const filename = `learn-what-you-own-${profile.username}-${exportedAt.slice(0, 10)}.json`;
    return new Response(`${JSON.stringify(payload, null, 2)}\n`, { headers: { "content-type": "application/json; charset=utf-8", "content-disposition": `attachment; filename="${filename}"`, "cache-control": "private, no-store" } });
  } catch (error) {
    return apiError(error);
  }
}
