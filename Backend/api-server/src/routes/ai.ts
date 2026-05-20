import { Router, type IRouter } from "express";
import { eq, asc, sql } from "drizzle-orm";
import { db, schema } from "../lib/db";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.use(requireAuth);

router.get("/ai/progress", async (req, res) => {
  const userId = req.userId!;
  
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, userId));
  
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const completed = await db
    .select()
    .from(schema.userLessonProgress)
    .where(eq(schema.userLessonProgress.userId, userId));
  
  const perfectLessons = completed.filter((c) => c.perfect).length;
  const lessonsCompleted = completed.length;
  const totalLessons = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(schema.lessons);
  
  const lessonRuns = await db
    .select()
    .from(schema.lessonRuns)
    .where(eq(schema.lessonRuns.userId, userId))
    .orderBy(asc(schema.lessonRuns.date));
  
  // Calculate weekly XP
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weeklyRuns = lessonRuns.filter(r => new Date(r.date) >= oneWeekAgo);
  const totalWeeklyXp = weeklyRuns.reduce((sum, r) => sum + r.xpEarned, 0);
  
  // Weekly analysis by day
  const weeklyXpByDay: Array<{ day: string; xp: number }> = [];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dayName = days[date.getDay()];
    const dayRuns = lessonRuns.filter(r => {
      const runDate = new Date(r.date);
      return runDate.toDateString() === date.toDateString();
    });
    const dayXp = dayRuns.reduce((sum, r) => sum + r.xpEarned, 0);
    weeklyXpByDay.push({ day: dayName, xp: dayXp });
  }

  // Study consistency
  const uniqueDays = new Set(lessonRuns.map(r => new Date(r.date).toDateString())).size;
  const studyConsistency = uniqueDays >= 5 ? "Excellent" : uniqueDays >= 3 ? "Good" : "Needs improvement";

  // Weak areas (lessons with low crowns)
  const weakAreas = await db
    .select()
    .from(schema.userLessonProgress)
    .where(eq(schema.userLessonProgress.userId, userId));
  
  const weakAreasList = await Promise.all(
    weakAreas
      .filter(p => p.crowns < 2)
      .slice(0, 3)
      .map(async (p) => {
        const [lesson] = await db
          .select()
          .from(schema.lessons)
          .where(eq(schema.lessons.id, p.lessonId));
        return {
          id: lesson.id,
          title: lesson.title,
          crowns: p.crowns,
        };
      })
  );

  // Recommendations
  const recommendations: Array<{
    type: string;
    message: string;
    priority: string;
  }> = [];
  
  if (user.streakDays === 0) {
    recommendations.push({
      type: "streak",
      message: "Start a learning streak today to earn bonus rewards!",
      priority: "high",
    });
  }
  
  if (weakAreasList.length > 0) {
    recommendations.push({
      type: "practice",
      message: `Focus on ${weakAreasList[0].title} to improve your weak areas.`,
      priority: "medium",
    });
  }
  
  if (user.hearts < user.maxHearts) {
    recommendations.push({
      type: "hearts",
      message: "Your hearts are low. Consider waiting for refill or visiting the shop.",
      priority: "low",
    });
  }

  const result = {
    overallProgress: {
      completionRate: totalLessons[0]?.count ? (lessonsCompleted / totalLessons[0].count) * 100 : 0,
      totalLessons: totalLessons[0]?.count || 0,
      completedLessons: lessonsCompleted,
      totalXp: user.xp,
      perfectRate: lessonsCompleted ? (perfectLessons / lessonsCompleted) * 100 : 0,
    },
    weeklyAnalysis: {
      weeklyXp: weeklyXpByDay,
      totalWeeklyXp,
      studyConsistency,
      streakDays: user.streakDays,
      longestStreakDays: user.longestStreakDays,
    },
    weakAreas: weakAreasList,
    recommendations,
  };

  res.json(result);
});

router.get("/ai/recommend-lesson", async (req, res) => {
  const userId = req.userId!;
  
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, userId));
  
  if (!user || !user.activeCourseId) {
    res.json({
      recommendation: null,
      reason: "No active course selected",
    });
    return;
  }

  // Find the next incomplete lesson
  const courseUnits = await db
    .select()
    .from(schema.units)
    .where(eq(schema.units.courseId, user.activeCourseId))
    .orderBy(asc(schema.units.order));

  const completedLessons = await db
    .select()
    .from(schema.userLessonProgress)
    .where(eq(schema.userLessonProgress.userId, userId));
  
  const completedLessonIds = new Set(completedLessons.map(p => p.lessonId));

  for (const unit of courseUnits) {
    const lessons = await db
      .select()
      .from(schema.lessons)
      .where(eq(schema.lessons.unitId, unit.id))
      .orderBy(asc(schema.lessons.order));

    for (const lesson of lessons) {
      if (!completedLessonIds.has(lesson.id)) {
        res.json({
          recommendation: {
            lessonId: lesson.id,
            title: lesson.title,
            unitId: unit.id,
            unitTitle: unit.title,
            reason: "Continue your learning journey",
            priority: "high",
          },
          reason: "Next lesson in your course",
        });
        return;
      }
    }
  }

  // All lessons completed
  res.json({
    recommendation: null,
    reason: "You've completed all lessons in this course!",
  });
});

export default router;
