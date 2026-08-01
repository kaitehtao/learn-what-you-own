import { apiError, requireSupabaseUser } from "../../supabase-server";

export const dynamic = "force-dynamic";

type ProfileReference = { username?: string; display_name?: string } | Array<{ username?: string; display_name?: string }> | null;
type MessageRow = Record<string, unknown> & { sender?: ProfileReference; recipient?: ProfileReference };

function profileFrom(value: ProfileReference) {
  return Array.isArray(value) ? value[0] ?? null : value;
}

function publicMessage(row: MessageRow, currentUserId: string) {
  const sender = profileFrom(row.sender ?? null);
  const recipient = profileFrom(row.recipient ?? null);
  return {
    id: row.id,
    subject: row.subject,
    body: row.body,
    visibility: row.visibility === "public" ? "public" : "private",
    readAt: row.read_at,
    createdAt: row.created_at,
    direction: row.sender_id === currentUserId ? "sent" : "received",
    sender: { username: sender?.username ?? "member", displayName: sender?.display_name ?? "" },
    recipient: { username: recipient?.username ?? "member", displayName: recipient?.display_name ?? "" },
  };
}

const messageSelection = "id,sender_id,recipient_id,subject,body,visibility,read_at,created_at,sender:profiles!private_messages_sender_id_fkey(username,display_name),recipient:profiles!private_messages_recipient_id_fkey(username,display_name)";

export async function GET(request: Request) {
  try {
    const { profile, supabase } = await requireSupabaseUser(request);
    if (!profile.onboarding_complete) return Response.json({ error: "Complete your username before using messages." }, { status: 403 });
    const params = new URL(request.url).searchParams;
    const recipientQuery = (params.get("recipients") ?? "").trim().replace(/[^A-Za-z0-9_]/g, "").slice(0, 24);

    if (recipientQuery) {
      const { data, error } = await supabase.from("profiles")
        .select("username,display_name")
        .ilike("username", `${recipientQuery}%`)
        .neq("user_id", profile.user_id)
        .eq("onboarding_complete", true)
        .order("username")
        .limit(8);
      if (error) throw error;
      return Response.json({ recipients: data ?? [] });
    }

    const folder = params.get("folder") === "sent" ? "sent" : "inbox";
    let query = supabase.from("private_messages").select(messageSelection).order("created_at", { ascending: false }).limit(100);
    query = folder === "sent"
      ? query.eq("sender_id", profile.user_id).is("sender_deleted_at", null)
      : query.eq("recipient_id", profile.user_id).is("recipient_deleted_at", null);

    const [{ data, error }, unreadResult] = await Promise.all([
      query,
      supabase.from("private_messages").select("id", { count: "exact", head: true })
        .eq("recipient_id", profile.user_id).is("recipient_deleted_at", null).is("read_at", null),
    ]);
    if (error) throw error;
    if (unreadResult.error) throw unreadResult.error;
    return Response.json({
      folder,
      unread: unreadResult.count ?? 0,
      messages: (data as MessageRow[] | null)?.map(row => publicMessage(row, profile.user_id)) ?? [],
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { profile, supabase } = await requireSupabaseUser(request);
    if (!profile.onboarding_complete) return Response.json({ error: "Complete your username before sending messages." }, { status: 403 });
    const payload = await request.json() as { recipientUsername?: string; subject?: string; body?: string; visibility?: string };
    const recipientUsername = String(payload.recipientUsername ?? "").trim();
    const subject = String(payload.subject ?? "").trim();
    const body = String(payload.body ?? "").trim();
    const visibility = payload.visibility === "public" ? "public" : "private";
    if (!/^[A-Za-z0-9_]{3,24}$/.test(recipientUsername)) return Response.json({ error: "Enter a valid recipient username." }, { status: 400 });
    if (subject.length < 1 || subject.length > 120) return Response.json({ error: "Subject must be between 1 and 120 characters." }, { status: 400 });
    if (body.length < 1 || body.length > 5000) return Response.json({ error: "Message must be between 1 and 5,000 characters." }, { status: 400 });

    const { data, error } = await supabase.rpc("send_member_message", {
      recipient_username: recipientUsername,
      message_subject: subject,
      message_body: body,
      message_visibility: visibility,
    });
    if (error) return Response.json({ error: error.message }, { status: error.message.includes("not found") ? 404 : 400 });
    return Response.json({ message: data }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const { supabase } = await requireSupabaseUser(request);
    const payload = await request.json() as { id?: number };
    if (!Number.isInteger(payload.id) || Number(payload.id) < 1) return Response.json({ error: "Choose a valid message." }, { status: 400 });
    const { data, error } = await supabase.rpc("mark_private_message_read", { message_id: payload.id });
    if (error) return Response.json({ error: error.message }, { status: 404 });
    return Response.json({ message: data });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const { supabase } = await requireSupabaseUser(request);
    const payload = await request.json() as { id?: number };
    if (!Number.isInteger(payload.id) || Number(payload.id) < 1) return Response.json({ error: "Choose a valid message." }, { status: 400 });
    const { error } = await supabase.rpc("delete_private_message", { message_id: payload.id });
    if (error) return Response.json({ error: error.message }, { status: 404 });
    return Response.json({ deleted: true });
  } catch (error) {
    return apiError(error);
  }
}
