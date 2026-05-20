import { Router, type IRouter } from "express";
import { asc, eq, sql } from "drizzle-orm";
import { clerkMiddleware } from "@clerk/express";
import { ListCoursesResponse, GetCourseResponse } from "@workspace/api-zod";
import { db, schema } from "../lib/db";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

// Protected endpoint for course details by ID (must come before / to avoid matching)
router.get(
  "/:courseId",
  // Temporarily disable auth for development
  // clerkMiddleware({
  //   publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
  //   secretKey: process.env.CLERK_SECRET_KEY,
  // }),
  // requireAuth,
  async (req, res) => {
    // Temporarily use a hardcoded user ID for development
    const userId = req.userId || "dev-user-123";
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
      .where(eq(schema.userLessonProgress.userId, userId));
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
  },
);

// Public endpoint for listing courses
router.get("/", async (_req, res) => {
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

// Protected endpoint for course details - use a more specific path
router.get(
  "/details/:courseId",
  // Temporarily disable auth for development
  // clerkMiddleware({
  //   publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
  //   secretKey: process.env.CLERK_SECRET_KEY,
  // }),
  // requireAuth,
  async (req, res) => {
    // Temporarily use a hardcoded user ID for development
    const userId = req.userId || "dev-user-123";
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
      .where(eq(schema.userLessonProgress.userId, userId));
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
  },
);

export default router;
