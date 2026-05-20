import { Router, type IRouter } from "express";
import { and, asc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import {
  GetLessonResponse,
  CompleteLessonBody,
  CompleteLessonResponse,
  CheckAnswerBody,
  CheckAnswerResponse,
} from "@workspace/api-zod";
import { db, schema } from "../lib/db";
import { LEAGUES, isLeague } from "../lib/leagues";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.use(requireAuth);

function normalize(s: string) {
  return s.trim().toLowerCase().replace(/[¿¡.,!?]/g, "").replace(/\s+/g, " ");
}

router.get("/lessons/:lessonId", async (req, res) => {
  const lessonId = req.params.lessonId;
  const [lesson] = await db
    .select()
    .from(schema.lessons)
    .where(eq(schema.lessons.id, lessonId));
  if (!lesson) {
    res.status(404).json({ error: "Lesson not found" });
    return;
  }

  const [course] = await db
    .select()
    .from(schema.courses)
    .where(eq(schema.courses.id, lesson.courseId));

  const exs = await db
    .select()
    .from(schema.exercises)
    .where(eq(schema.exercises.lessonId, lessonId))
    .orderBy(asc(schema.exercises.order));

  res.json(
    GetLessonResponse.parse({
      id: lesson.id,
      title: lesson.title,
      unitId: lesson.unitId,
      courseId: lesson.courseId,
      accentColor: course?.accentColor ?? "#58cc02",
      exercises: exs.map((e) => ({
        id: e.id,
        order: e.order,
        kind: e.kind,
        prompt: e.prompt,
        promptTranslation: e.promptTranslation ?? null,
        audioUrl: e.audioUrl ?? null,
        choices: e.choices
          ? (e.choices as Array<string | { id: string; text: string; imageUrl?: string | null }>).map(
              (c) => typeof c === "string" ? { id: c, text: c, imageUrl: null } : c,
            )
          : null,
        wordBank: e.wordBank ?? null,
        pairs: e.pairs ?? null,
        hint: e.hint ?? null,
        correctAnswer: e.correctAnswer ?? null,
      })),
    }),
  );
});

router.post("/exercises/:exerciseId/answer", async (req, res) => {
  const exerciseId = req.params.exerciseId;
  const body = CheckAnswerBody.parse(req.body);
  const [ex] = await db
    .select()
    .from(schema.exercises)
    .where(eq(schema.exercises.id, exerciseId));
  if (!ex) {
    res.status(404).json({ error: "Exercise not found" });
    return;
  }

  const accepted = [ex.correctAnswer, ...(ex.acceptedAnswers ?? [])].map(
    normalize,
  );
  const correct = accepted.includes(normalize(body.answer));

  res.json(
    CheckAnswerResponse.parse({
      correct,
      correctAnswer: ex.correctAnswer,
      explanation: ex.explanation ?? null,
    }),
  );
});

function bumpLeague(currentLeague: string, weeklyXp: number): string {
  const currentIdx = LEAGUES.indexOf(
    isLeague(currentLeague) ? currentLeague : "bronze",
  );
  if (weeklyXp > 600 && currentIdx < LEAGUES.length - 1) {
    return LEAGUES[currentIdx + 1]!;
  }
  return LEAGUES[currentIdx]!;
}

router.post("/lessons/:lessonId/complete", async (req, res) => {
  const userId = req.userId!;
  const lessonId = req.params.lessonId;
  const body = CompleteLessonBody.parse(req.body);
  const [lesson] = await db
    .select()
    .from(schema.lessons)
    .where(eq(schema.lessons.id, lessonId));
  if (!lesson) {
    res.status(404).json({ error: "Lesson not found" });
    return;
  }

  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, userId));
  if (!user) throw new Error("User missing");

  const baseXp = 10;
  const wrongCount = body.totalCount - body.correctCount;
  const perfect = wrongCount === 0;
  const perfectBonusXp = perfect ? 5 : 0;
  const gemsAwarded = perfect ? 5 : 2;

  const newHearts = Math.max(0, user.hearts - wrongCount);

  const todayIso = new Date().toISOString().slice(0, 10);
  let newStreak = user.streakDays;
  let streakIncreased = false;
  if (user.lastActiveDate !== todayIso) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayIso = yesterday.toISOString().slice(0, 10);
    if (user.lastActiveDate === yesterdayIso) {
      newStreak = user.streakDays + 1;
    } else {
      newStreak = 1;
    }
    streakIncreased = true;
  }

  const streakBonusXp = streakIncreased ? Math.min(50, newStreak * 2) : 0;
  const bonusXp = perfectBonusXp + streakBonusXp;
  const xpAwarded = baseXp + bonusXp;

  const newXp = user.xp + xpAwarded;
  const oldLevel = Math.floor(user.xp / 100);
  const newLevel = Math.floor(newXp / 100);
  const leveledUp = newLevel > oldLevel;

  const newLongest = Math.max(user.longestStreakDays, newStreak);

  const todayRuns = await db
    .select()
    .from(schema.lessonRuns)
    .where(eq(schema.lessonRuns.userId, userId));
  const recentXp = todayRuns
    .filter((r) => {
      const d = new Date(r.date);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);
      return d >= cutoff;
    })
    .reduce((s, r) => s + r.xpEarned, 0);
  const newLeague = bumpLeague(user.league, recentXp + xpAwarded);

  await db
    .update(schema.users)
    .set({
      xp: newXp,
      gems: user.gems + gemsAwarded,
      hearts: newHearts,
      streakDays: newStreak,
      longestStreakDays: newLongest,
      league: newLeague,
      lastActiveDate: todayIso,
    })
    .where(eq(schema.users.id, userId));

  await db.insert(schema.lessonRuns).values({
    id: randomUUID(),
    userId,
    lessonId,
    date: todayIso,
    xpEarned: xpAwarded,
    correctCount: body.correctCount,
    totalCount: body.totalCount,
    timeSeconds: body.timeSeconds,
  });

  const [existingProgress] = await db
    .select()
    .from(schema.userLessonProgress)
    .where(
      and(
        eq(schema.userLessonProgress.userId, userId),
        eq(schema.userLessonProgress.lessonId, lessonId),
      ),
    );
  if (!existingProgress) {
    await db.insert(schema.userLessonProgress).values({
      id: randomUUID(),
      userId,
      lessonId,
      crowns: perfect ? 2 : 1,
      perfect,
    });
  } else {
    await db
      .update(schema.userLessonProgress)
      .set({
        crowns: Math.min(5, existingProgress.crowns + 1),
        perfect: existingProgress.perfect || perfect,
      })
      .where(eq(schema.userLessonProgress.id, existingProgress.id));
  }

  const [updatedUser] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, userId));
  let activeCourse = null;
  if (updatedUser?.activeCourseId) {
    const [c] = await db
      .select()
      .from(schema.courses)
      .where(eq(schema.courses.id, updatedUser.activeCourseId));
    if (c) activeCourse = c;
  }

  const profile = updatedUser
    ? {
        id: updatedUser.id,
        username: updatedUser.username,
        displayName: updatedUser.displayName,
        avatarColor: updatedUser.avatarColor,
        xp: updatedUser.xp,
        gems: updatedUser.gems,
        hearts: updatedUser.hearts,
        maxHearts: updatedUser.maxHearts,
        heartsRefillAt: updatedUser.heartsRefillAt
          ? updatedUser.heartsRefillAt.toISOString()
          : null,
        streakDays: updatedUser.streakDays,
        league: isLeague(updatedUser.league) ? updatedUser.league : "bronze",
        dailyGoalXp: updatedUser.dailyGoalXp,
        activeCourseId: updatedUser.activeCourseId,
        activeCourse,
      }
    : null;

  res.json(
    CompleteLessonResponse.parse({
      xpAwarded,
      bonusXp,
      newStreakDays: newStreak,
      heartsRemaining: newHearts,
      leveledUp,
      gemsAwarded,
      profile,
    }),
  );
});

export default router;
