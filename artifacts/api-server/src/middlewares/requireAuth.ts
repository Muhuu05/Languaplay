import type { Request, Response, NextFunction } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { eq } from "drizzle-orm";
import { db, schema } from "../lib/db";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

const COLORS = ["#58cc02", "#1cb0f6", "#ce82ff", "#ff9600", "#ff4b4b", "#ff86d0", "#ffc800"];

function pickColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return COLORS[h % COLORS.length];
}

async function ensureUser(clerkUserId: string): Promise<void> {
  const [existing] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, clerkUserId));
  if (existing) return;

  let username = "сурагч";
  let displayName = "Шинэ сурагч";
  try {
    const clerkUser = await clerkClient.users.getUser(clerkUserId);
    username =
      clerkUser.username ||
      clerkUser.primaryEmailAddress?.emailAddress?.split("@")[0] ||
      `user${clerkUserId.slice(-6)}`;
    displayName =
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
      clerkUser.username ||
      username;
  } catch {
    // fall through with defaults
  }

  await db
    .insert(schema.users)
    .values({
      id: clerkUserId,
      username,
      displayName,
      avatarColor: pickColor(clerkUserId),
      activeCourseId: "course-en",
    })
    .onConflictDoNothing({ target: schema.users.id });
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    await ensureUser(userId);
    req.userId = userId;
    next();
  } catch (err) {
    next(err);
  }
}
