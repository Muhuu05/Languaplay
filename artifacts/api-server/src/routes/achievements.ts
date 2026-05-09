import { Router, type IRouter } from "express";
import { asc, eq } from "drizzle-orm";
import { ListAchievementsResponse } from "@workspace/api-zod";
import { db, schema } from "../lib/db";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.use(requireAuth);

router.get("/achievements", async (req, res) => {
  const userId = req.userId!;
  const allAch = await db
    .select()
    .from(schema.achievements)
    .orderBy(asc(schema.achievements.sortOrder));

  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, userId));
  if (!user) throw new Error("User missing");

  const completed = await db
    .select()
    .from(schema.userLessonProgress)
    .where(eq(schema.userLessonProgress.userId, userId));
  const perfectLessons = completed.filter((c) => c.perfect).length;
  const lessonsCompleted = completed.length;

  function metricValue(m: string): number {
    switch (m) {
      case "xp":
        return user.xp;
      case "streak":
        return user.longestStreakDays;
      case "lessons":
        return lessonsCompleted;
      case "perfect":
        return perfectLessons;
      case "gems":
        return user.gems;
      default:
        return 0;
    }
  }

  const result = allAch.map((a) => {
    const value = metricValue(a.metric);
    const progress = Math.min(value, a.target);
    return {
      id: a.id,
      title: a.title,
      description: a.description,
      icon: a.icon,
      tier: a.tier,
      progress,
      target: a.target,
      unlocked: value >= a.target,
    };
  });

  res.json(ListAchievementsResponse.parse(result));
});

export default router;
