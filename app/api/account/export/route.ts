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

function markdownEscape(value: unknown) {
  return String(value ?? "").replaceAll("\r\n", "\n").trim();
}

function notebookMarkdown(
  profile: { username: string },
  exportedAt: string,
  notebooks: Array<Record<string, unknown>>,
  notes: Array<Record<string, unknown>>,
  publications: Array<Record<string, unknown>>,
  analystWorkspaces: Array<Record<string, unknown>>,
  analystDrivers: Array<Record<string, unknown>>,
  analystScenarios: Array<Record<string, unknown>>,
  analystDecisions: Array<Record<string, unknown>>,
) {
  const lines = [`# Learn What You Own research export`, "", `- Member: @${profile.username}`, `- Exported: ${exportedAt}`, `- Format: portable Markdown with source metadata`, ""];
  for (const notebook of notebooks) {
    lines.push(`## ${markdownEscape(notebook.ticker)} — ${markdownEscape(notebook.company_name)}`, "", `**Conviction:** ${markdownEscape(notebook.conviction) || "Unranked"}`, "", `**Working thesis:** ${markdownEscape(notebook.thesis) || "Not recorded"}`, "");
    for (const note of notes.filter(item => item.notebook_id === notebook.id)) {
      lines.push(`### ${markdownEscape(note.title)}`, "", `- Type: ${markdownEscape(note.note_type)}`, `- Status: ${markdownEscape(note.status)}`, `- Tags: ${Array.isArray(note.tags) ? note.tags.map(tag => `#${tag}`).join(" ") : ""}`, `- Created: ${markdownEscape(note.created_at)}`, `- Updated: ${markdownEscape(note.updated_at)}`);
      if (note.source_title) lines.push(`- Source title: ${markdownEscape(note.source_title)}`);
      if (note.source_url) lines.push(`- Source URL: ${markdownEscape(note.source_url)}`);
      if (note.source_date) lines.push(`- Evidence date: ${markdownEscape(note.source_date)}`);
      lines.push("", markdownEscape(note.body), "");
      if (note.source_excerpt) lines.push("> Source excerpt", ">", ...markdownEscape(note.source_excerpt).split("\n").map(line => `> ${line}`), "");
    }
  }
  const inbox = notes.filter(item => item.notebook_id === null);
  if (inbox.length) {
    lines.push("## Research inbox", "");
    for (const note of inbox) lines.push(`### ${markdownEscape(note.title)}`, "", markdownEscape(note.body || note.source_excerpt), "", note.source_url ? `Source: ${markdownEscape(note.source_url)}` : "", "");
  }
  if (publications.length) {
    lines.push("## Long-form publications", "");
    for (const item of publications) {
      lines.push(`### ${markdownEscape(item.title)}`, "", `- Status: ${markdownEscape(item.status)} / ${markdownEscape(item.editorial_status)}`, `- Visibility: ${markdownEscape(item.visibility)}`, `- Tickers: ${Array.isArray(item.tickers) ? item.tickers.join(", ") : ""}`, `- Revision: ${markdownEscape(item.revision_number)}`, "", markdownEscape(item.summary), "", markdownEscape(item.body), "", "#### Bull case", "", markdownEscape(item.bull_case), "", "#### Bear case", "", markdownEscape(item.bear_case), "", "#### Risks", "", markdownEscape(item.risks), "", "#### Catalysts", "", markdownEscape(item.catalysts), "", "#### Valuation", "", markdownEscape(item.valuation), "", "#### Citations", "");
      if (Array.isArray(item.citations)) for (const citation of item.citations as Array<Record<string, unknown>>) lines.push(`- ${markdownEscape(citation.title) || "Source"}${citation.url ? ` — ${markdownEscape(citation.url)}` : ""}${citation.date ? ` (${markdownEscape(citation.date)})` : ""}`, citation.excerpt ? `  - ${markdownEscape(citation.excerpt)}` : "");
      lines.push("", `**Position disclosure:** ${markdownEscape(item.position_disclosure) || "Not stated"}`, "", `**Conflict disclosure:** ${markdownEscape(item.conflict_disclosure) || "Not stated"}`, "");
    }
  }
  if (analystWorkspaces.length) {
    lines.push("## Private analyst workspaces", "", "> These records were private in Learn What You Own and were never published automatically.", "");
    for (const workspace of analystWorkspaces) {
      lines.push(
        `### ${markdownEscape(workspace.ticker)} analyst record`, "",
        `- Workflow: ${markdownEscape(workspace.workflow_status)}`,
        `- Assessment: ${markdownEscape(workspace.recommendation)}`,
        `- Horizon: ${markdownEscape(workspace.time_horizon)}`,
        `- Conviction: ${markdownEscape(workspace.conviction)}/5`,
        `- Updated: ${markdownEscape(workspace.updated_at)}`, "",
        "#### Consensus view", "", markdownEscape(workspace.consensus_view) || "Not recorded", "",
        "#### Variant view", "", markdownEscape(workspace.variant_view) || "Not recorded", "",
        "#### Current view", "", markdownEscape(workspace.current_view) || "Not recorded", "",
      );
      const drivers = analystDrivers.filter((item) => item.workspace_id === workspace.id);
      if (drivers.length) {
        lines.push("#### Thesis drivers", "");
        for (const driver of drivers) lines.push(`- **${markdownEscape(driver.direction)} — ${markdownEscape(driver.title)}:** ${markdownEscape(driver.hypothesis)}${driver.source_url ? ` ([evidence](${markdownEscape(driver.source_url)}))` : ""}`);
        lines.push("");
      }
      const scenarios = analystScenarios.filter((item) => item.workspace_id === workspace.id);
      if (scenarios.length) {
        lines.push("#### Valuation scenarios", "");
        for (const scenario of scenarios) lines.push(`- **${markdownEscape(scenario.scenario)}:** ${markdownEscape(scenario.probability_pct)}% probability; price target ${markdownEscape(scenario.price_target) || "not recorded"}; ${markdownEscape(scenario.notes)}`);
        lines.push("");
      }
      const decisions = analystDecisions.filter((item) => item.workspace_id === workspace.id);
      if (decisions.length) {
        lines.push("#### Decision journal", "");
        for (const decision of decisions) lines.push(`- **${markdownEscape(decision.created_at)} — ${markdownEscape(decision.decision)}:** ${markdownEscape(decision.rationale)}`);
        lines.push("");
      }
    }
  }
  return `${lines.join("\n")}\n`;
}

export async function GET(request: Request) {
  try {
    const { user, profile } = await requireSupabaseUser(request);
    const admin = getSupabaseAdminClient();
    const id = user.id;
    const [watchlist, portfolio, contributions, messages, follows, notebooks, notes, attachments, preferences, notifications, researchVotes, corrections, emailOutbox, accountAudit, deletionRequests, publications, publicationRevisions, publicationBookmarks, publicationComments, blocks, mutes, reports, analystWorkspaces, analystDrivers, analystScenarios, analystDecisions] = await Promise.all([
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
      admin.from("research_publications").select("*").eq("user_id", id).order("created_at"),
      admin.from("research_publication_revisions").select("*").eq("editor_user_id", id).order("created_at"),
      admin.from("research_bookmarks").select("*").eq("user_id", id).order("created_at"),
      admin.from("research_comments").select("*").eq("user_id", id).order("created_at"),
      admin.from("member_blocks").select("*").eq("blocker_id", id).order("created_at"),
      admin.from("member_mutes").select("*").eq("muter_id", id).order("created_at"),
      admin.from("community_reports").select("*").eq("reporter_id", id).order("created_at"),
      admin.from("analyst_workspaces").select("*").eq("user_id", id).order("created_at"),
      admin.from("analyst_thesis_drivers").select("*").eq("user_id", id).order("created_at"),
      admin.from("analyst_valuation_scenarios").select("*").eq("user_id", id).order("created_at"),
      admin.from("analyst_decision_journal").select("*").eq("user_id", id).order("created_at"),
    ]);
    const results = [watchlist, portfolio, contributions, messages, follows, notebooks, notes, attachments, preferences, notifications, researchVotes, corrections, emailOutbox, accountAudit, deletionRequests, publications, publicationRevisions, publicationBookmarks, publicationComments, blocks, mutes, reports, analystWorkspaces, analystDrivers, analystScenarios, analystDecisions];
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
    if (new URL(request.url).searchParams.get("format") === "markdown") {
      const markdown = notebookMarkdown(profile, exportedAt, notebooks.data ?? [], notes.data ?? [], publications.data ?? [], analystWorkspaces.data ?? [], analystDrivers.data ?? [], analystScenarios.data ?? [], analystDecisions.data ?? []);
      const filename = `learn-what-you-own-research-${profile.username}-${exportedAt.slice(0, 10)}.md`;
      return new Response(markdown, { headers: { "content-type": "text/markdown; charset=utf-8", "content-disposition": `attachment; filename="${filename}"`, "cache-control": "private, no-store" } });
    }
    const payload = {
      format: "learn-what-you-own-member-export-v1",
      exportedAt,
      account: { id, email: user.email, createdAt: user.created_at, lastSignInAt: user.last_sign_in_at, profile },
      data: {
        watchlist: watchlist.data ?? [], portfolio: portfolio.data ?? [], contributions: contributions.data ?? [], messages: messages.data ?? [],
        follows: follows.data ?? [], researchNotebooks: notebooks.data ?? [], researchNotes: notes.data ?? [], researchAttachments: attachments.data ?? [],
        notificationPreferences: preferences.data ?? [], notifications: notifications.data ?? [], emailNotificationOutbox: emailOutbox.data ?? [],
        companyResearchVotes: researchVotes.data ?? [], contributionCorrections: corrections.data ?? [], accountAudit: accountAudit.data ?? [], deletionRequests: deletionRequests.data ?? [],
        researchPublications: publications.data ?? [], researchPublicationRevisions: publicationRevisions.data ?? [], researchBookmarks: publicationBookmarks.data ?? [], researchComments: publicationComments.data ?? [],
        blocks: blocks.data ?? [], mutes: mutes.data ?? [], communityReports: reports.data ?? [],
        analystWorkspaces: analystWorkspaces.data ?? [], analystThesisDrivers: analystDrivers.data ?? [], analystValuationScenarios: analystScenarios.data ?? [], analystDecisionJournal: analystDecisions.data ?? [],
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
