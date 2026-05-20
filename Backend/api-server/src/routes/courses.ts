import { Router, type IRouter } from "express";
import { asc, eq, inArray, sql } from "drizzle-orm";
import { ListCoursesResponse, GetCourseResponse } from "@workspace/api-zod";
import { db, schema } from "../lib/db";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

async function listCourses() {
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

  return courses.map((course) => ({
    ...course,
    learnerCount: countMap.get(course.id) ?? 0,
  }));
}

async function getCourseDetail(courseId: string, userId: string) {
  const [course] = await db
    .select()
    .from(schema.courses)
    .where(eq(schema.courses.id, courseId));

  if (!course) return null;

  const [countRow] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(schema.users)
    .where(eq(schema.users.activeCourseId, courseId));

  const [courseUnits, courseLessons, progress] = await Promise.all([
    db
      .select()
      .from(schema.units)
      .where(eq(schema.units.courseId, courseId))
      .orderBy(asc(schema.units.order)),
    db
      .select()
      .from(schema.lessons)
      .where(eq(schema.lessons.courseId, courseId))
      .orderBy(asc(schema.lessons.order)),
    db
      .select()
      .from(schema.userLessonProgress)
      .where(eq(schema.userLessonProgress.userId, userId)),
  ]);

  const lessonIds = courseLessons.map((lesson) => lesson.id);
  const exerciseCounts = lessonIds.length
    ? await db
        .select({
          lessonId: schema.exercises.lessonId,
          count: sql<number>`cast(count(*) as int)`,
        })
        .from(schema.exercises)
        .where(inArray(schema.exercises.lessonId, lessonIds))
        .groupBy(schema.exercises.lessonId)
    : [];

  const exercisesByLesson = new Map(
    exerciseCounts.map((row) => [row.lessonId, row.count]),
  );
  const progressByLesson = new Map(progress.map((row) => [row.lessonId, row]));
  const lessonsByUnit = new Map<string, typeof courseLessons>();

  for (const lesson of courseLessons) {
    const unitLessons = lessonsByUnit.get(lesson.unitId) ?? [];
    unitLessons.push(lesson);
    lessonsByUnit.set(lesson.unitId, unitLessons);
  }

  const units = courseUnits.map((unit) => {
    const lessonsForUnit = lessonsByUnit.get(unit.id) ?? [];

    return {
      id: unit.id,
      order: unit.order,
      title: unit.title,
      description: unit.description,
      color: unit.color,
      lessons: lessonsForUnit.map((lesson, index) => {
        const prog = progressByLesson.get(lesson.id);
        const previousLesson = lessonsForUnit[index - 1];
        const prevDone =
          index === 0 ||
          (previousLesson
            ? Boolean(progressByLesson.get(previousLesson.id))
            : false);
        const exerciseCount = exercisesByLesson.get(lesson.id) ?? 0;

        return {
          id: lesson.id,
          order: lesson.order,
          title: lesson.title,
          kind: lesson.kind,
          exerciseCount,
          completedCount: prog ? exerciseCount : 0,
          crowns: prog?.crowns ?? 0,
          locked: !prog && !prevDone,
        };
      }),
    };
  });

  return {
    course: {
      ...course,
      learnerCount: countRow?.count ?? 0,
    },
    units,
  };
}

router.get("/", async (_req, res) => {
  res.json(ListCoursesResponse.parse(await listCourses()));
});

router.get("/:courseId", requireAuth, async (req, res) => {
  const userId = req.userId!;
  const detail = await getCourseDetail(req.params.courseId as string, userId);

  if (!detail) {
    res.status(404).json({ error: "Course not found" });
    return;
  }

  res.json(GetCourseResponse.parse(detail));
});

export default router;
