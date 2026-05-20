import { Router, type IRouter } from "express";
import { asc, eq, sql } from "drizzle-orm";
import healthRouter from "./health";
import meRouter from "./me";
import lessonsRouter from "./lessons";
import leaderboardRouter from "./leaderboard";
import achievementsRouter from "./achievements";
import shopRouter from "./shop";
import coursesRouter from "./courses";
import aiRouter from "./ai";
import { db, schema } from "../lib/db";
import { requireAuth } from "../middlewares/requireAuth";
import { ListCoursesResponse, GetCourseResponse } from "@workspace/api-zod";

const router: IRouter = Router();

// Public endpoint for listing courses (must be before meRouter to avoid inheriting requireAuth)
router.get("/courses", async (_req, res) => {
  const courses = await db
    .select()
    .from(schema.courses)
    .orderBy(asc(schema.courses.sortOrder));

  const counts = await db
    .select({
      courseId: schema.users.activeCourseId,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(schema.users)
    .groupBy(schema.users.activeCourseId);

  const countMap = new Map(counts.map((c) => [c.courseId, c.count]));

  const result = courses.map((c) => ({
    ...c,
    learnerCount: countMap.get(c.id) ?? 0,
  }));

  res.json(ListCoursesResponse.parse(result));
});

router.use(healthRouter);
router.use("/courses", coursesRouter);
router.use(meRouter);
router.use(lessonsRouter);
router.use(leaderboardRouter);
router.use(achievementsRouter);
router.use(shopRouter);
router.use(aiRouter);

// Protected endpoint for course details
router.get("/courses/details/:courseId", requireAuth, async (req, res) => {
  const courseId = req.params.courseId as string;
  const [course] = await db
    .select()
    .from(schema.courses)
    .where(eq(schema.courses.id, courseId));
  if (!course) {
    res.status(404).json({ error: "Course not found" });
    return;
  }

  const [countRow] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(schema.users)
    .where(eq(schema.users.activeCourseId, courseId));

  const courseWithCount = {
    ...course,
    learnerCount: countRow?.count ?? 0,
  };

  const courseUnits = await db
    .select()
    .from(schema.units)
    .where(eq(schema.units.courseId, courseId))
    .orderBy(asc(schema.units.order));

  const courseLessons = await db
    .select()
    .from(schema.lessons)
    .where(eq(schema.lessons.courseId, courseId))
    .orderBy(asc(schema.lessons.order));

  const allExercises = await db.select().from(schema.exercises);
  const exercisesByLesson = new Map<string, number>();
  for (const ex of allExercises) {
    exercisesByLesson.set(
      ex.lessonId,
      (exercisesByLesson.get(ex.lessonId) ?? 0) + 1,
    );
  }

  const progress = await db
    .select()
    .from(schema.userLessonProgress)
    .where(eq(schema.userLessonProgress.userId, req.userId!));
  const progressByLesson = new Map(progress.map((p) => [p.lessonId, p]));

  const units = courseUnits.map((unit) => {
    const lessonsForUnit = courseLessons
      .filter((l) => l.unitId === unit.id)
      .map((l, idx, arr) => {
        const prog = progressByLesson.get(l.id);
        const prevDone =
          idx === 0 ? true : !!progressByLesson.get(arr[idx - 1]!.id);
        return {
          id: l.id,
          order: l.order,
          title: l.title,
          kind: l.kind,
          exerciseCount: exercisesByLesson.get(l.id) ?? 0,
          completedCount: prog ? (exercisesByLesson.get(l.id) ?? 0) : 0,
          crowns: prog?.crowns ?? 0,
          locked: !prog && !prevDone,
        };
      });
    return {
      id: unit.id,
      order: unit.order,
      title: unit.title,
      description: unit.description,
      color: unit.color,
      lessons: lessonsForUnit,
    };
  });

  res.json(
    GetCourseResponse.parse({
      course: courseWithCount,
      units,
    }),
  );
});

export default router;
