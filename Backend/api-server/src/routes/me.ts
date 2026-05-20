import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import {
  GetMeResponse,
  GetMyStatsResponse,
  GetMyStreakResponse,
  GetDailyGoalResponse,
  SetDailyGoalBody,
  SetDailyGoalResponse,
  SetActiveCourseBody,
  SetActiveCourseResponse,
} from "@workspace/api-zod";
import { db, schema } from "../lib/db";
import { isLeague } from "../lib/leagues";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

// Temporarily disable auth for development
// router.use(requireAuth);

async function loadProfile(userId: string) {
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, userId));
  if (!user) throw new Error("User missing");

  let activeCourse = null;
  if (user.activeCourseId) {
    const [course] = await db
      .select()
      .from(schema.courses)
      .where(eq(schema.courses.id, user.activeCourseId));
    if (course) activeCourse = course;
  }

  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarColor: user.avatarColor,
    xp: user.xp,
    gems: user.gems,
    hearts: user.hearts,
    maxHearts: user.maxHearts,
    heartsRefillAt: user.heartsRefillAt
      ? user.heartsRefillAt.toISOString()
      : null,
    streakDays: user.streakDays,
    league: isLeague(user.league) ? user.league : "bronze",
    dailyGoalXp: user.dailyGoalXp,
    activeCourseId: user.activeCourseId,
    activeCourse,
  };
}

router.get("/me", async (req, res) => {
  // Temporarily use a hardcoded user ID for development
  const userId = req.userId || "dev-user-123";
  const profile = await loadProfile(userId);
  res.json(GetMeResponse.parse(profile));
});

router.get("/me/stats", async (req, res) => {
  // Temporarily use a hardcoded user ID for development
  const userId = req.userId || "dev-user-123";
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, userId));
  if (!user) throw new Error("User missing");

  const runs = await db
    .select()
    .from(schema.lessonRuns)
    .where(eq(schema.lessonRuns.userId, userId));

  const completed = await db
    .select()
    .from(schema.userLessonProgress)
    .where(eq(schema.userLessonProgress.userId, userId));

  const lessonsCompleted = completed.length;
  const perfectLessons = completed.filter((c) => c.perfect).length;
  const totalSeconds = runs.reduce((s, r) => s + r.timeSeconds, 0);
  const minutesStudied = Math.round(totalSeconds / 60);
  const wordsLearned = lessonsCompleted * 6;

  const today = new Date();
  const weeklyXp: Array<{ day: string; xp: number }> = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
    const xp = runs
      .filter((r) => r.date === iso)
      .reduce((s, r) => s + r.xpEarned, 0);
    weeklyXp.push({ day: dayName, xp });
  }

  res.json(
    GetMyStatsResponse.parse({
      totalXp: user.xp,
      lessonsCompleted,
      minutesStudied,
      wordsLearned,
      perfectLessons,
      longestStreakDays: user.longestStreakDays,
      weeklyXp,
    }),
  );
});

router.get("/me/streak", async (req, res) => {
  // Temporarily use a hardcoded user ID for development
  const userId = req.userId || "dev-user-123";
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, userId));
  if (!user) throw new Error("User missing");

  const runs = await db
    .select()
    .from(schema.lessonRuns)
    .where(eq(schema.lessonRuns.userId, userId));

  const today = new Date();
  const days: Array<{ date: string; xp: number; completed: boolean }> = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const xp = runs
      .filter((r) => r.date === iso)
      .reduce((s, r) => s + r.xpEarned, 0);
    days.push({ date: iso, xp, completed: xp > 0 });
  }

  res.json(
    GetMyStreakResponse.parse({
      streakDays: user.streakDays,
      longestStreakDays: user.longestStreakDays,
      days,
    }),
  );
});

router.get("/me/daily-goal", async (req, res) => {
  // Temporarily use a hardcoded user ID for development
  const userId = req.userId || "dev-user-123";
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, userId));
  if (!user) throw new Error("User missing");

  const todayIso = new Date().toISOString().slice(0, 10);
  const runs = await db
    .select()
    .from(schema.lessonRuns)
    .where(eq(schema.lessonRuns.userId, userId));
  const earnedTodayXp = runs
    .filter((r) => r.date === todayIso)
    .reduce((s, r) => s + r.xpEarned, 0);

  res.json(
    GetDailyGoalResponse.parse({
      goalXp: user.dailyGoalXp,
      earnedTodayXp,
    }),
  );
});

router.put("/me/daily-goal", async (req, res) => {
  // Temporarily use a hardcoded user ID for development
  const userId = req.userId || "dev-user-123";
  const body = SetDailyGoalBody.parse(req.body);
  await db
    .update(schema.users)
    .set({ dailyGoalXp: body.goalXp })
    .where(eq(schema.users.id, userId));

  const todayIso = new Date().toISOString().slice(0, 10);
  const runs = await db
    .select()
    .from(schema.lessonRuns)
    .where(eq(schema.lessonRuns.userId, userId));
  const earnedTodayXp = runs
    .filter((r) => r.date === todayIso)
    .reduce((s, r) => s + r.xpEarned, 0);

  res.json(
    SetDailyGoalResponse.parse({
      goalXp: body.goalXp,
      earnedTodayXp,
    }),
  );
});

router.put("/me/active-course", async (req, res) => {
  // Temporarily use a hardcoded user ID for development
  const userId = req.userId || "dev-user-123";
  const body = SetActiveCourseBody.parse(req.body);
  const [course] = await db
    .select()
    .from(schema.courses)
    .where(eq(schema.courses.id, body.courseId));
  if (!course) {
    res.status(404).json({ error: "Course not found" });
    return;
  }
  await db
    .update(schema.users)
    .set({ activeCourseId: body.courseId })
    .where(eq(schema.users.id, userId));

  const profile = await loadProfile(userId);
  res.json(SetActiveCourseResponse.parse(profile));
});

export default router;
