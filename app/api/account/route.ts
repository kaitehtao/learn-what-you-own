import { ensureMemberProfile } from "../../member";

export const dynamic = "force-dynamic";

export async function GET() {
  const profile = await ensureMemberProfile();
  if (!profile) return Response.json({ error: "Authentication required" }, { status: 401 });
  return Response.json({ profile });
}
