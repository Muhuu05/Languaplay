import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import {
  GetLeaderboardResponse,
  GetLeaderboardQueryParams,
} from "@workspace/api-zod";
import { db, schema } from "../lib/db";
import { isLeague } from "../lib/leagues";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.use(requireAuth);

router.get("/leaderboard", async (req, res) => {
  const params = GetLeaderboardQueryParams.parse(req.query);
  const userId = req.userId!;

  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, userId));
  if (!user) throw new Error("User missing");

  const league = params.league ?? (isLeague(user.league) ? user.league : "bronze");

  const others = await db
    .select()
    .from(schema.leaderboardUsers)
    .where(eq(schema.leaderboardUsers.league, league));

  // Compute current user's weekly XP from runs
  const runs = await db
    .select()
    .from(schema.lessonRuns)
    .where(eq(schema.lessonRuns.userId, userId));
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  const myWeekly = runs
    .filter((r) => new Date(r.date) >= cutoff)
    .reduce((s, r) => s + r.xpEarned, 0);

  const allEntries = [
    ...others.map((o) => ({
      userId: o.id,
      displayName: o.displayName,
      avatarColor: o.avatarColor,
      weeklyXp: o.weeklyXp,
      isMe: false,
    })),
    {
      userId: user.id,
      displayName: user.displayName,
      avatarColor: user.avatarColor,
      weeklyXp: myWeekly,
      isMe: true,
    },
  ];

  allEntries.sort((a, b) => b.weeklyXp - a.weeklyXp);
  const ranked = allEntries.map((e, i) => ({ rank: i + 1, ...e }));

  const weekEnd = new Date();
  const dayOfWeek = weekEnd.getDay();
  const daysUntilSunday = (7 - dayOfWeek) % 7 || 7;
  weekEnd.setDate(weekEnd.getDate() + daysUntilSunday);
  weekEnd.setHours(23, 59, 59, 0);

  res.json(
    GetLeaderboardResponse.parse({
      league,
      weekEndsAt: weekEnd.toISOString(),
      entries: ranked,
    }),
  );
});

export default router;
