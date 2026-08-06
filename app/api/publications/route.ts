import { apiError, getSupabaseAdminClient, getSupabaseForRequest, requireSupabaseUser } from "../../supabase-server";
import { enforceActionRateLimit } from "../../community-safety";
import { notifyPrivilegedReviewersSafely } from "../../admin-action-notifications";

export const dynamic = "force-dynamic";

const selectFields = "id,user_id,author_username,source_note_id,title,summary,body,bull_case,bear_case,risks,catalysts,valuation,tickers,citations,position_disclosure,conflict_disclosure,visibility,status,editorial_status,revision_number,published_at,withdrawn_at,created_at,updated_at";
const allowedVisibilities = new Set(["private", "followers", "selected", "public"]);

function clean(value: unknown, limit: number) { return String(value ?? "").trim().slice(0, limit); }
function positiveInteger(value: unknown) { const number = Number(value); return Number.isInteger(number) && number > 0 ? number : null; }
function cleanTickers(value: unknown) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(item => clean(item, 12).toUpperCase()).filter(item => /^[A-Z0-9.-]{1,12}$/.test(item)))].slice(0, 20);
}
function cleanCitations(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 50).map(item => {
    const source = item && typeof item === "object" ? item as Record<string, unknown> : {};
    return { title: clean(source.title, 240), url: clean(source.url, 2000), excerpt: clean(source.excerpt, 1200), date: clean(source.date, 10) };
  }).filter(source => source.title || source.url || source.excerpt);
}
function output(row: Record<string, unknown>, bookmarked = false) {
  return { id: row.id, authorUsername: row.author_username, sourceNoteId: row.source_note_id, title: row.title, summary: row.summary, body: row.body, bullCase: row.bull_case, bearCase: row.bear_case, risks: row.risks, catalysts: row.catalysts, valuation: row.valuation, tickers: row.tickers, citations: row.citations, positionDisclosure: row.position_disclosure, conflictDisclosure: row.conflict_disclosure, visibility: row.visibility, status: row.status, editorialStatus: row.editorial_status, revisionNumber: row.revision_number, publishedAt: row.published_at, withdrawnAt: row.withdrawn_at, createdAt: row.created_at, updatedAt: row.updated_at, bookmarked };
}

async function viewer(request: Request) {
  try {
    const requestClient = getSupabaseForRequest(request);
    const { data: { user } } = await requestClient.auth.getUser();
    if (!user?.id || !user.email_confirmed_at) return null;
    const { data } = await getSupabaseAdminClient().from("profiles").select("user_id,username,role").eq("user_id", user.id).maybeSingle();
    return data ? { userId: user.id, username: String(data.username), role: String(data.role) } : null;
  } catch { return null; }
}

async function viewerAccess(userId: string | null) {
  if (!userId) return { following: new Set<string>(), selected: new Set<number>(), bookmarks: new Set<number>(), muted: new Set<string>() };
  const admin = getSupabaseAdminClient();
  const [following, selected, bookmarks, mutes] = await Promise.all([
    admin.from("member_follows").select("followed_id").eq("follower_id", userId),
    admin.from("research_publication_recipients").select("publication_id").eq("user_id", userId),
    admin.from("research_bookmarks").select("publication_id").eq("user_id", userId),
    admin.from("member_mutes").select("muted_id").eq("muter_id", userId),
  ]);
  return { following: new Set((following.data ?? []).map(row => String(row.followed_id))), selected: new Set((selected.data ?? []).map(row => Number(row.publication_id))), bookmarks: new Set((bookmarks.data ?? []).map(row => Number(row.publication_id))), muted: new Set((mutes.data ?? []).map(row => String(row.muted_id))) };
}

function readable(row: Record<string, unknown>, userId: string | null, access: Awaited<ReturnType<typeof viewerAccess>>) {
  if (row.user_id === userId) return true;
  if (row.status !== "published" || row.editorial_status !== "approved" || access.muted.has(String(row.user_id))) return false;
  if (row.visibility === "public") return true;
  if (row.visibility === "followers") return access.following.has(String(row.user_id));
  if (row.visibility === "selected") return access.selected.has(Number(row.id));
  return false;
}

export async function GET(request: Request) {
  try {
    const admin = getSupabaseAdminClient();
    const currentViewer = await viewer(request);
    const access = await viewerAccess(currentViewer?.userId ?? null);
    const params = new URL(request.url).searchParams;
    const id = positiveInteger(params.get("id"));
    const ticker = clean(params.get("ticker"), 12).toUpperCase();
    const author = clean(params.get("author"), 24);
    const feed = clean(params.get("feed"), 20);
    let query = admin.from("research_publications").select(selectFields).order("published_at", { ascending: false, nullsFirst: false }).order("updated_at", { ascending: false }).limit(id ? 1 : 200);
    if (id) query = query.eq("id", id);
    if (ticker) query = query.contains("tickers", [ticker]);
    if (author) query = query.ilike("author_username", author);
    const { data, error } = await query;
    if (error) throw error;
    let rows = (data ?? []).filter(row => readable(row, currentViewer?.userId ?? null, access));
    if (feed === "following") rows = rows.filter(row => access.following.has(String(row.user_id)));
    if (feed === "mine") rows = rows.filter(row => row.user_id === currentViewer?.userId);
    if (feed === "bookmarks") rows = rows.filter(row => access.bookmarks.has(Number(row.id)));
    if (!id) return Response.json({ publications: rows.map(row => output(row, access.bookmarks.has(Number(row.id)))), viewer: currentViewer });
    const publication = rows[0];
    if (!publication) return Response.json({ error: "Research publication not found." }, { status: 404 });
    const [comments, revisions] = await Promise.all([
      admin.from("research_comments").select("id,author_username,body,status,created_at,updated_at").eq("publication_id", id).eq("status", "published").order("created_at"),
      admin.from("research_publication_revisions").select("revision_number,change_summary,created_at").eq("publication_id", id).order("revision_number", { ascending: false }),
    ]);
    if (comments.error) throw comments.error;
    if (revisions.error) throw revisions.error;
    return Response.json({ publication: output(publication, access.bookmarks.has(Number(publication.id))), comments: comments.data ?? [], revisions: revisions.data ?? [], viewer: currentViewer });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    const { profile } = await requireSupabaseUser(request);
    const admin = getSupabaseAdminClient();
    const payload = await request.json() as Record<string, unknown>;
    const action = clean(payload.action, 30) || "create";
    if (action === "bookmark") {
      const publicationId = positiveInteger(payload.publicationId);
      if (!publicationId) return Response.json({ error: "Choose a publication." }, { status: 400 });
      if (payload.bookmarked === false) await admin.from("research_bookmarks").delete().eq("user_id", profile.user_id).eq("publication_id", publicationId);
      else await admin.from("research_bookmarks").upsert({ user_id: profile.user_id, publication_id: publicationId });
      return Response.json({ bookmarked: payload.bookmarked !== false });
    }
    if (action === "comment") {
      await enforceActionRateLimit(admin, profile.user_id, "research_comment", 30, 3600);
      const publicationId = positiveInteger(payload.publicationId);
      const body = clean(payload.body, 3000);
      if (!publicationId || !body) return Response.json({ error: "Choose a publication and enter a comment." }, { status: 400 });
      const { data: publication } = await admin.from("research_publications").select(selectFields).eq("id", publicationId).maybeSingle();
      const access = await viewerAccess(profile.user_id);
      if (!publication || !readable(publication, profile.user_id, access)) return Response.json({ error: "Publication not found." }, { status: 404 });
      const { data, error } = await admin.from("research_comments").insert({ publication_id: publicationId, user_id: profile.user_id, author_username: profile.username, body }).select("id,author_username,body,status,created_at,updated_at").single();
      if (error) throw error;
      if (publication.user_id !== profile.user_id) await admin.from("notifications").upsert({ user_id: publication.user_id, actor_id: profile.user_id, kind: "research_comment", title: `New comment from @${profile.username}`, detail: clean(publication.title, 160), href: `/research/community?id=${publication.id}`, entity_type: "research_comment", entity_id: data.id }, { onConflict: "user_id,entity_type,entity_id", ignoreDuplicates: true });
      return Response.json({ comment: data }, { status: 201 });
    }

    const sourceNoteId = positiveInteger(payload.sourceNoteId);
    await enforceActionRateLimit(admin, profile.user_id, "research_publication", 10, 86400);
    let sourceNote: Record<string, unknown> | null = null;
    let sourceTicker = "";
    if (sourceNoteId) {
      const { data } = await admin.from("research_notes").select("id,title,body,source_title,source_url,source_excerpt,notebook_id").eq("id", sourceNoteId).eq("user_id", profile.user_id).maybeSingle();
      if (!data) return Response.json({ error: "Private source note not found." }, { status: 404 });
      sourceNote = data;
      if (data.notebook_id) {
        const { data: notebook } = await admin.from("research_notebooks").select("ticker").eq("id", data.notebook_id).eq("user_id", profile.user_id).maybeSingle();
        sourceTicker = String(notebook?.ticker ?? "");
      }
    }
    const title = clean(payload.title, 180) || clean(sourceNote?.title, 180);
    if (title.length < 3) return Response.json({ error: "A research title is required." }, { status: 400 });
    const visibility = allowedVisibilities.has(String(payload.visibility)) ? String(payload.visibility) : "private";
    const record = {
      user_id: profile.user_id, author_username: profile.username, source_note_id: sourceNoteId, title,
      summary: clean(payload.summary, 1200), body: clean(payload.body, 60000) || clean(sourceNote?.body, 60000) || clean(sourceNote?.source_excerpt, 60000),
      bull_case: clean(payload.bullCase, 12000), bear_case: clean(payload.bearCase, 12000), risks: clean(payload.risks, 12000), catalysts: clean(payload.catalysts, 12000), valuation: clean(payload.valuation, 12000),
      tickers: cleanTickers(Array.isArray(payload.tickers) ? payload.tickers : sourceTicker ? [sourceTicker] : []),
      citations: cleanCitations(payload.citations ?? (sourceNote?.source_url ? [{ title: sourceNote.source_title || sourceNote.title, url: sourceNote.source_url, excerpt: sourceNote.source_excerpt }] : [])),
      position_disclosure: clean(payload.positionDisclosure, 1000), conflict_disclosure: clean(payload.conflictDisclosure, 1000), visibility,
      status: "draft", editorial_status: payload.submitForReview === true ? "pending" : "not_submitted",
    };
    const { data, error } = await admin.from("research_publications").insert(record).select(selectFields).single();
    if (error) throw error;
    const selected = Array.isArray(payload.selectedUsernames) ? payload.selectedUsernames.map(item => clean(item, 24)).filter(Boolean) : [];
    if (visibility === "selected" && selected.length) {
      const { data: profiles } = await admin.from("profiles").select("user_id").in("username", selected);
      if (profiles?.length) await admin.from("research_publication_recipients").insert(profiles.map(row => ({ publication_id: data.id, user_id: row.user_id })));
    }
    if (payload.submitForReview === true) {
      await notifyPrivilegedReviewersSafely({
        actorId: profile.user_id,
        title: "Long-form research awaiting editorial review",
        detail: `${title} · submitted by @${profile.username}`,
        href: "/admin#community-safety",
        entityType: `research_publication_review_${data.revision_number}`,
        entityId: data.id,
      });
    }
    return Response.json({ publication: output(data) }, { status: 201 });
  } catch (error) { return apiError(error); }
}

export async function PATCH(request: Request) {
  try {
    const { profile } = await requireSupabaseUser(request);
    const admin = getSupabaseAdminClient();
    const payload = await request.json() as Record<string, unknown>;
    const id = positiveInteger(payload.id);
    if (!id) return Response.json({ error: "Choose a publication." }, { status: 400 });
    const { data: current } = await admin.from("research_publications").select(selectFields).eq("id", id).eq("user_id", profile.user_id).maybeSingle();
    if (!current) return Response.json({ error: "Publication not found." }, { status: 404 });
    if (payload.action === "withdraw") {
      const { data, error } = await admin.from("research_publications").update({ status: "withdrawn", withdrawn_at: new Date().toISOString() }).eq("id", id).eq("user_id", profile.user_id).select(selectFields).single();
      if (error) throw error;
      return Response.json({ publication: output(data) });
    }
    if (current.editorial_status === "approved") return Response.json({ error: "Withdraw this published report before creating a replacement draft." }, { status: 409 });
    await admin.from("research_publication_revisions").insert({ publication_id: id, revision_number: current.revision_number, editor_user_id: profile.user_id, snapshot: current, change_summary: clean(payload.changeSummary, 500) });
    const updates: Record<string, unknown> = { revision_number: Number(current.revision_number) + 1 };
    for (const [input, column, limit] of [["title", "title", 180], ["summary", "summary", 1200], ["body", "body", 60000], ["bullCase", "bull_case", 12000], ["bearCase", "bear_case", 12000], ["risks", "risks", 12000], ["catalysts", "catalysts", 12000], ["valuation", "valuation", 12000], ["positionDisclosure", "position_disclosure", 1000], ["conflictDisclosure", "conflict_disclosure", 1000]] as const) if (payload[input] !== undefined) updates[column] = clean(payload[input], limit);
    if (payload.tickers !== undefined) updates.tickers = cleanTickers(payload.tickers);
    if (payload.citations !== undefined) updates.citations = cleanCitations(payload.citations);
    if (payload.visibility !== undefined && allowedVisibilities.has(String(payload.visibility))) updates.visibility = String(payload.visibility);
    if (payload.submitForReview === true) updates.editorial_status = "pending";
    const { data, error } = await admin.from("research_publications").update(updates).eq("id", id).eq("user_id", profile.user_id).select(selectFields).single();
    if (error) throw error;
    if (payload.submitForReview === true) {
      await notifyPrivilegedReviewersSafely({
        actorId: profile.user_id,
        title: "Revised research awaiting editorial review",
        detail: `${data.title} · resubmitted by @${profile.username}`,
        href: "/admin#community-safety",
        entityType: `research_publication_review_${data.revision_number}`,
        entityId: data.id,
      });
    }
    return Response.json({ publication: output(data) });
  } catch (error) { return apiError(error); }
}
