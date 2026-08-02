import { env } from "cloudflare:workers";
import { ensureProfessionalInterviewsSchema } from "../../../../db/runtimeSchema";
import { awardPoints, rewardRules } from "../../../../db/rewards";
import { apiError, requireEditor } from "../../../supabase-server";

export const dynamic = "force-dynamic";
const statuses = new Set(["submitted","reviewing","approved","rejected"]);

export async function GET(request: Request) {
  try {
    await requireEditor(request);
    await ensureProfessionalInterviewsSchema();
    const result = await env.DB.prepare("SELECT * FROM professional_interviews ORDER BY created_at DESC LIMIT 200").all<Record<string, unknown>>();
    return Response.json({ interviews:result.results.map(row => ({ id:row.id,userId:row.user_id,username:row.username,guestName:row.guest_name,guestTitle:row.guest_title,firm:row.firm,credentials:row.credentials,title:row.title,summary:row.summary,interviewUrl:row.interview_url,transcriptUrl:row.transcript_url,disclosure:row.disclosure,status:row.status,moderatorNote:row.moderator_note,createdAt:row.created_at })) });
  } catch (error) { return apiError(error); }
}

export async function PATCH(request: Request) {
  try {
    const { profile } = await requireEditor(request);
    await ensureProfessionalInterviewsSchema();
    const payload = await request.json() as { id?:number; status?:string; moderatorNote?:string };
    if (!Number.isInteger(payload.id) || !statuses.has(payload.status ?? "")) return Response.json({ error:"Choose a valid interview and moderation status." }, { status:400 });
    const row = await env.DB.prepare("SELECT id,user_id,username,title FROM professional_interviews WHERE id=?").bind(payload.id).first<{id:number;user_id:string;username:string;title:string}>();
    if (!row) return Response.json({ error:"Interview submission not found." }, { status:404 });
    await env.DB.prepare("UPDATE professional_interviews SET status=?,moderator_note=?,moderated_by=?,moderated_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=?")
      .bind(payload.status,String(payload.moderatorNote ?? "").trim().slice(0,1000),profile.username,payload.id).run();
    const pointsAwarded = payload.status === "approved" ? await awardPoints({ userId:row.user_id,username:row.username,eventType:"approved_professional_interview",sourceType:"professional_interview",sourceId:row.id,points:rewardRules.approvedInterview,description:`Professional interview approved: ${row.title}`,awardedBy:profile.username }) : 0;
    return Response.json({ ok:true, pointsAwarded });
  } catch (error) { return apiError(error); }
}
