import { asc, eq, sql } from "drizzle-orm";
import { getDb } from "../db";
import { profiles } from "../db/schema";
import { getChatGPTUser, requireChatGPTUser } from "./chatgpt-auth";

export type MemberProfile = typeof profiles.$inferSelect;

export async function ensureMemberProfile(): Promise<MemberProfile | null> {
  const user = await getChatGPTUser();
  if (!user) return null;
  return ensureProfile(user.email, user.displayName);
}

export async function requireMemberProfile(returnTo: string): Promise<MemberProfile> {
  const user = await requireChatGPTUser(returnTo);
  return ensureProfile(user.email, user.displayName);
}

async function ensureProfile(email: string, displayName: string): Promise<MemberProfile> {
  const db = getDb();
  const existing = await db.select().from(profiles).where(eq(profiles.email, email)).limit(1);
  if (existing[0]) {
    if (existing[0].displayName !== displayName) {
      await db.update(profiles).set({ displayName, updatedAt: sql`CURRENT_TIMESTAMP` }).where(eq(profiles.email, email));
      return { ...existing[0], displayName };
    }
    return existing[0];
  }

  const first = await db.select({ email: profiles.email }).from(profiles).orderBy(asc(profiles.createdAt)).limit(1);
  const role = first.length === 0 ? "admin" : "member";
  await db.insert(profiles).values({ email, displayName, role }).onConflictDoNothing();
  const created = await db.select().from(profiles).where(eq(profiles.email, email)).limit(1);
  if (!created[0]) throw new Error("Unable to initialize member profile.");
  return created[0];
}

export function canModerate(profile: MemberProfile) {
  return profile.role === "editor" || profile.role === "admin";
}
