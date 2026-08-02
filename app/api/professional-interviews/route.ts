import { env } from "cloudflare:workers";
import { ensureProfessionalInterviewsSchema } from "../../../db/runtimeSchema";
import { apiError, requireSupabaseUser } from "../../supabase-server";

export const dynamic = "force-dynamic";

type InterviewRow = { id:number; username:string; guest_name:string; guest_title:string; firm:string; credentials:string; title:string; summary:string; topics_json:string; interview_url:string; transcript_url:string; disclosure:string; created_at:string };

function publicInterview(row: InterviewRow) {
  let topics: string[] = [];
  try { topics = JSON.parse(row.topics_json) as string[]; } catch { topics = []; }
  return { id:row.id, username:row.username, guestName:row.guest_name, guestTitle:row.guest_title, firm:row.firm, credentials:row.credentials, title:row.title, summary:row.summary, topics, interviewUrl:row.interview_url, transcriptUrl:row.transcript_url, disclosure:row.disclosure, publishedAt:row.created_at };
}

function validUrl(value: string) {
  try { const url = new URL(value); return url.protocol === "https:"; } catch { return false; }
}

export async function GET() {
  try {
    await ensureProfessionalInterviewsSchema();
    const result = await env.DB.prepare("SELECT id,username,guest_name,guest_title,firm,credentials,title,summary,topics_json,interview_url,transcript_url,disclosure,created_at FROM professional_interviews WHERE status='approved' ORDER BY moderated_at DESC,created_at DESC LIMIT 100").all<InterviewRow>();
    return Response.json({ interviews: result.results.map(publicInterview) }, { headers:{ "cache-control":"public, max-age=30, s-maxage=60" } });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    const { profile } = await requireSupabaseUser(request);
    await ensureProfessionalInterviewsSchema();
    const payload = await request.json() as Record<string, unknown>;
    const guestName = String(payload.guestName ?? "").trim();
    const guestTitle = String(payload.guestTitle ?? "").trim();
    const firm = String(payload.firm ?? "").trim();
    const credentials = String(payload.credentials ?? "").trim();
    const title = String(payload.title ?? "").trim();
    const summary = String(payload.summary ?? "").trim();
    const interviewUrl = String(payload.interviewUrl ?? "").trim();
    const transcriptUrl = String(payload.transcriptUrl ?? "").trim();
    const disclosure = String(payload.disclosure ?? "").trim();
    const topics = String(payload.topics ?? "").split(",").map(topic => topic.trim()).filter(Boolean).slice(0, 8);
    if (guestName.length < 2 || guestName.length > 100 || guestTitle.length < 2 || guestTitle.length > 140) return Response.json({ error:"Add the guest’s name and professional role." }, { status:400 });
    if (credentials.length < 20 || credentials.length > 1000) return Response.json({ error:"Explain the guest’s relevant professional background (20–1,000 characters)." }, { status:400 });
    if (title.length < 10 || title.length > 160 || summary.length < 60 || summary.length > 3000) return Response.json({ error:"Add a clear title and a substantive 60–3,000 character summary." }, { status:400 });
    if (!validUrl(interviewUrl) || (transcriptUrl && !validUrl(transcriptUrl))) return Response.json({ error:"Interview and transcript links must use secure HTTPS URLs." }, { status:400 });
    if (disclosure.length < 10 || disclosure.length > 1500) return Response.json({ error:"Position and conflict disclosure is required." }, { status:400 });
    const result = await env.DB.prepare(`INSERT INTO professional_interviews (user_id,username,guest_name,guest_title,firm,credentials,title,summary,topics_json,interview_url,transcript_url,disclosure) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
      .bind(profile.user_id,profile.username,guestName,guestTitle,firm,credentials,title,summary,JSON.stringify(topics),interviewUrl,transcriptUrl,disclosure).run();
    return Response.json({ id:result.meta.last_row_id, status:"submitted" }, { status:201 });
  } catch (error) { return apiError(error); }
}
