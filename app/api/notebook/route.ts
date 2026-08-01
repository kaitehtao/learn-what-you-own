import { researchUniverse } from "../../data/universe";
import { apiError, requireSupabaseUser } from "../../supabase-server";

export const dynamic = "force-dynamic";

const noteTypes = new Set(["general", "source", "thesis", "bull_case", "bear_case", "risk", "catalyst", "question", "task"]);
const noteStatuses = new Set(["active", "done", "archived"]);
const convictions = new Set(["unranked", "watching", "low", "medium", "high"]);

function tickerCompany(value: unknown) {
  const ticker = String(value ?? "").trim().toUpperCase();
  return researchUniverse.find((company) => company.ticker === ticker);
}

function cleanText(value: unknown, limit: number) {
  return String(value ?? "").trim().slice(0, limit);
}

function cleanTags(value: unknown) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((tag) => cleanText(tag, 32).toLowerCase()).filter(Boolean))].slice(0, 20);
}

function cleanSourceUrl(value: unknown) {
  const url = cleanText(value, 2000);
  if (!url) return "";
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function publicNotebook(row: Record<string, unknown>) {
  return {
    id: row.id,
    ticker: row.ticker,
    companyName: row.company_name,
    thesis: row.thesis,
    conviction: row.conviction,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function publicNote(row: Record<string, unknown>) {
  return {
    id: row.id,
    notebookId: row.notebook_id,
    noteType: row.note_type,
    title: row.title,
    body: row.body,
    status: row.status,
    tags: row.tags,
    sourceTitle: row.source_title,
    sourceUrl: row.source_url,
    sourceExcerpt: row.source_excerpt,
    sourceDate: row.source_date,
    pinned: row.pinned,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getOrCreateNotebook(
  supabase: Awaited<ReturnType<typeof requireSupabaseUser>>["supabase"],
  userId: string,
  tickerValue: unknown,
  companyNameValue?: unknown,
) {
  const company = tickerCompany(tickerValue);
  if (!company) throw new Response(JSON.stringify({ error: "Choose a ticker from the research universe." }), { status: 400, headers: { "content-type": "application/json" } });
  const companyName = cleanText(companyNameValue, 160) || company.name;
  const { data, error } = await supabase.from("research_notebooks")
    .upsert({ user_id: userId, ticker: company.ticker, company_name: companyName }, { onConflict: "user_id,ticker" })
    .select("*")
    .single();
  if (error) throw error;
  return data as Record<string, unknown>;
}

export async function GET(request: Request) {
  try {
    const { profile, supabase } = await requireSupabaseUser(request);
    const [notebooksResult, notesResult] = await Promise.all([
      supabase.from("research_notebooks").select("*").eq("user_id", profile.user_id).order("ticker"),
      supabase.from("research_notes").select("*").eq("user_id", profile.user_id)
        .order("pinned", { ascending: false }).order("updated_at", { ascending: false }).limit(1000),
    ]);
    if (notebooksResult.error) throw notebooksResult.error;
    if (notesResult.error) throw notesResult.error;
    return Response.json({
      notebooks: (notebooksResult.data ?? []).map((row) => publicNotebook(row)),
      notes: (notesResult.data ?? []).map((row) => publicNote(row)),
      owner: { username: profile.username, displayName: profile.display_name },
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { profile, supabase } = await requireSupabaseUser(request);
    const payload = await request.json() as Record<string, unknown>;
    const action = String(payload.action ?? "create_note");

    if (action === "create_notebook") {
      const notebook = await getOrCreateNotebook(supabase, profile.user_id, payload.ticker, payload.companyName);
      return Response.json({ notebook: publicNotebook(notebook) }, { status: 201 });
    }

    let notebookId: number | null = Number.isInteger(payload.notebookId) ? Number(payload.notebookId) : null;
    if (payload.ticker) {
      const notebook = await getOrCreateNotebook(supabase, profile.user_id, payload.ticker, payload.companyName);
      notebookId = Number(notebook.id);
    }
    if (notebookId !== null) {
      const { data: ownedNotebook, error } = await supabase.from("research_notebooks").select("id")
        .eq("id", notebookId).eq("user_id", profile.user_id).maybeSingle();
      if (error) throw error;
      if (!ownedNotebook) return Response.json({ error: "Notebook not found." }, { status: 404 });
    }

    const noteType = noteTypes.has(String(payload.noteType)) ? String(payload.noteType) : action === "capture" ? "source" : "general";
    const title = cleanText(payload.title, 160) || (noteType === "source" ? "Saved research source" : "Untitled research note");
    const sourceUrl = cleanSourceUrl(payload.sourceUrl);
    if (sourceUrl === null) return Response.json({ error: "Source URL must begin with http:// or https://." }, { status: 400 });
    const sourceDate = cleanText(payload.sourceDate, 10);
    if (sourceDate && !/^\d{4}-\d{2}-\d{2}$/.test(sourceDate)) return Response.json({ error: "Choose a valid source date." }, { status: 400 });

    const { data, error } = await supabase.from("research_notes").insert({
      user_id: profile.user_id,
      notebook_id: notebookId,
      note_type: noteType,
      title,
      body: cleanText(payload.body, 30000),
      status: noteStatuses.has(String(payload.status)) ? String(payload.status) : "active",
      tags: cleanTags(payload.tags),
      source_title: cleanText(payload.sourceTitle, 240),
      source_url: sourceUrl,
      source_excerpt: cleanText(payload.sourceExcerpt, 12000),
      source_date: sourceDate || null,
      pinned: Boolean(payload.pinned),
    }).select("*").single();
    if (error) throw error;
    return Response.json({ note: publicNote(data) }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const { profile, supabase } = await requireSupabaseUser(request);
    const payload = await request.json() as Record<string, unknown>;
    const entity = payload.entity === "notebook" ? "notebook" : "note";
    const id = Number(payload.id);
    if (!Number.isInteger(id) || id < 1) return Response.json({ error: `Choose a valid ${entity}.` }, { status: 400 });

    if (entity === "notebook") {
      const updates: Record<string, unknown> = {};
      if (payload.thesis !== undefined) updates.thesis = cleanText(payload.thesis, 12000);
      if (payload.companyName !== undefined) updates.company_name = cleanText(payload.companyName, 160);
      if (payload.conviction !== undefined && convictions.has(String(payload.conviction))) updates.conviction = String(payload.conviction);
      const { data, error } = await supabase.from("research_notebooks").update(updates)
        .eq("id", id).eq("user_id", profile.user_id).select("*").single();
      if (error) throw error;
      return Response.json({ notebook: publicNotebook(data) });
    }

    const updates: Record<string, unknown> = {};
    if (payload.noteType !== undefined && noteTypes.has(String(payload.noteType))) updates.note_type = String(payload.noteType);
    if (payload.title !== undefined) {
      const title = cleanText(payload.title, 160);
      if (!title) return Response.json({ error: "A note title is required." }, { status: 400 });
      updates.title = title;
    }
    if (payload.body !== undefined) updates.body = cleanText(payload.body, 30000);
    if (payload.status !== undefined && noteStatuses.has(String(payload.status))) updates.status = String(payload.status);
    if (payload.tags !== undefined) updates.tags = cleanTags(payload.tags);
    if (payload.sourceTitle !== undefined) updates.source_title = cleanText(payload.sourceTitle, 240);
    if (payload.sourceUrl !== undefined) {
      const sourceUrl = cleanSourceUrl(payload.sourceUrl);
      if (sourceUrl === null) return Response.json({ error: "Source URL must begin with http:// or https://." }, { status: 400 });
      updates.source_url = sourceUrl;
    }
    if (payload.sourceExcerpt !== undefined) updates.source_excerpt = cleanText(payload.sourceExcerpt, 12000);
    if (payload.sourceDate !== undefined) {
      const sourceDate = cleanText(payload.sourceDate, 10);
      if (sourceDate && !/^\d{4}-\d{2}-\d{2}$/.test(sourceDate)) return Response.json({ error: "Choose a valid source date." }, { status: 400 });
      updates.source_date = sourceDate || null;
    }
    if (payload.pinned !== undefined) updates.pinned = Boolean(payload.pinned);
    if (payload.notebookId !== undefined) updates.notebook_id = payload.notebookId === null ? null : Number(payload.notebookId);

    const { data, error } = await supabase.from("research_notes").update(updates)
      .eq("id", id).eq("user_id", profile.user_id).select("*").single();
    if (error) throw error;
    return Response.json({ note: publicNote(data) });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const { profile, supabase } = await requireSupabaseUser(request);
    const payload = await request.json() as { entity?: string; id?: number };
    const id = Number(payload.id);
    if (!Number.isInteger(id) || id < 1) return Response.json({ error: "Choose a valid item." }, { status: 400 });
    const table = payload.entity === "notebook" ? "research_notebooks" : "research_notes";
    const { error } = await supabase.from(table).delete().eq("id", id).eq("user_id", profile.user_id);
    if (error) throw error;
    return Response.json({ deleted: true });
  } catch (error) {
    return apiError(error);
  }
}
