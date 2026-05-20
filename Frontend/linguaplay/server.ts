// @ts-nocheck
import express from "express";
import fs from "fs";
import path from "path";
import cors from "cors";

const app = express();
const PORT = 5050;

app.use(
  cors({
    origin: "http://localhost:3002",
    credentials: true,
  }),
);
app.use(express.json());

// Log every request that hits this server so we can see it in the terminal
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Simple JSON database implementation
function toCamelCase(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => toCamelCase(item));
  }

  const result = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) =>
        letter.toUpperCase(),
      );
      result[camelKey] = toCamelCase(obj[key]);
    }
  }
  return result;
}

function normalizeExercises(exercises) {
  return exercises.map((exercise) => {
    const normalized = { ...exercise };

    // Convert choices from strings to objects if needed
    if (normalized.choices && Array.isArray(normalized.choices)) {
      if (typeof normalized.choices[0] === "string") {
        normalized.choices = normalized.choices.map((text, index) => ({
          id: String.fromCharCode(97 + index), // a, b, c, d...
          text: text,
        }));
      }
    }

    return normalized;
  });
}

function loadJsonFile(filename) {
  try {
    const filePath = path.join(process.cwd(), "..", "..", filename);
    if (!fs.existsSync(filePath)) {
      console.warn(`File not found: ${filePath}`);
      return [];
    }
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading ${filename}:`, error);
    return [];
  }
}

// Initialize database
const db = {
  users: toCamelCase(loadJsonFile("users.json")),
  courses: toCamelCase(loadJsonFile("courses.json")),
  units: toCamelCase(loadJsonFile("units.json")),
  lessons: toCamelCase(loadJsonFile("lessons.json")),
  exercises: normalizeExercises(toCamelCase(loadJsonFile("exercises.json"))),
  achievements: toCamelCase(loadJsonFile("achievements.json")),
  shopItems: toCamelCase(loadJsonFile("shop_items.json")),
  leaderboardUsers: toCamelCase(loadJsonFile("leaderboard_users.json")),
  lessonRuns: toCamelCase(loadJsonFile("lesson_runs.json")),
  userLessonProgress: toCamelCase(loadJsonFile("user_lesson_progress.json")),

  getAllUsers() {
    return this.users;
  },
  getAllCourses() {
    return this.courses.sort((a, b) => a.sortOrder - b.sortOrder);
  },
  getCourseById(id) {
    return this.courses.find((course) => course.id === id);
  },
  getCourseLearnerCount(courseId) {
    return this.users.filter((user) => user.activeCourseId === courseId).length;
  },
  getUnitsByCourseId(courseId) {
    return this.units
      .filter((unit) => unit.courseId === courseId)
      .sort((a, b) => a.order - b.order);
  },
  getLessonsByCourseId(courseId) {
    return this.lessons
      .filter((lesson) => lesson.courseId === courseId)
      .sort((a, b) => a.order - b.order);
  },
  getExercisesByLessonId(lessonId) {
    return this.exercises
      .filter((exercise) => exercise.lessonId === lessonId)
      .sort((a, b) => a.order - b.order);
  },
  getAllAchievements() {
    return this.achievements.sort((a, b) => a.sortOrder - b.sortOrder);
  },
  getAllShopItems() {
    return this.shopItems.sort((a, b) => a.sortOrder - b.sortOrder);
  },
  getShopItemById(id) {
    return this.shopItems.find((item) => item.id === id);
  },
  getLeaderboardUsers() {
    return this.leaderboardUsers.sort((a, b) => b.weeklyXp - a.weeklyXp);
  },
  getUserLessonProgress(userId) {
    return this.userLessonProgress.filter(
      (progress) => progress.userId === userId,
    );
  },
  getUserLessonProgressByLesson(userId, lessonId) {
    return this.userLessonProgress.find(
      (progress) =>
        progress.userId === userId && progress.lessonId === lessonId,
    );
  },
  getUserLessonRuns(userId) {
    return this.lessonRuns.filter((run) => run.userId === userId);
  },
  getDailyGoal(userId) {
    const user = this.users.find((u) => u.id === userId);
    if (!user) return { goalXp: 20, earnedTodayXp: 0 };

    const todayIso = new Date().toISOString().slice(0, 10);
    const todayRuns = this.lessonRuns.filter(
      (run) => run.userId === userId && run.date === todayIso,
    );
    const earnedTodayXp = todayRuns.reduce((sum, run) => sum + run.xpEarned, 0);

    return { goalXp: user.dailyGoalXp, earnedTodayXp };
  },
  getUserStats(userId) {
    const user = this.users.find((u) => u.id === userId);
    if (!user) return null;

    const progress = this.getUserLessonProgress(userId);
    const runs = this.getUserLessonRuns(userId);

    const lessonsCompleted = progress.length;
    const perfectLessons = progress.filter((p) => p.perfect).length;
    const totalSeconds = runs.reduce((sum, run) => sum + run.timeSeconds, 0);
    const minutesStudied = Math.round(totalSeconds / 60);
    const wordsLearned = lessonsCompleted * 6;

    return {
      totalXp: user.xp,
      lessonsCompleted,
      minutesStudied,
      wordsLearned,
      perfectLessons,
      longestStreakDays: user.longestStreakDays,
    };
  },
  getWeeklyXp(userId) {
    const runs = this.getUserLessonRuns(userId);
    const today = new Date();
    const weeklyXp = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
      const xp = runs
        .filter((run) => run.date === iso)
        .reduce((sum, run) => sum + run.xpEarned, 0);
      weeklyXp.push({ day: dayName, xp });
    }

    return weeklyXp;
  },
  getStreakData(userId) {
    const runs = this.getUserLessonRuns(userId);
    const today = new Date();
    const days = [];

    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const xp = runs
        .filter((run) => run.date === iso)
        .reduce((sum, run) => sum + run.xpEarned, 0);
      days.push({ date: iso, xp, completed: xp > 0 });
    }

    return days;
  },
};

// User endpoints
app.get(["/me", "/api/me"], (req, res) => {
  try {
    const users = db.getAllUsers();
    if (users.length === 0) {
      return res.status(404).json({ error: "No users found" });
    }
    res.json(users[0]);
  } catch (error) {
    console.error("Error in /me endpoint:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get(
  ["/daily-goal", "/api/daily-goal", "/me/daily-goal", "/api/me/daily-goal"],
  (req, res) => {
    try {
      const users = db.getAllUsers();
      if (users.length === 0) {
        return res.json({ goalXp: 20, earnedTodayXp: 0 });
      }
      const dailyGoal = db.getDailyGoal(users[0].id);
      res.json(dailyGoal);
    } catch (error) {
      console.error("Error in daily-goal endpoint:", error);
      res.json({ goalXp: 20, earnedTodayXp: 0 });
    }
  },
);

// User stats endpoint
app.get(["/me/stats", "/api/me/stats"], (req, res) => {
  try {
    const users = db.getAllUsers();
    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const user = users[0];
    const stats = db.getUserStats(user.id);
    const weeklyXp = db.getWeeklyXp(user.id);

    res.json({
      ...stats,
      weeklyXp,
    });
  } catch (error) {
    console.error("Error in /me/stats endpoint:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// User streak endpoint
app.get(["/me/streak", "/api/me/streak"], (req, res) => {
  try {
    const users = db.getAllUsers();
    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const user = users[0];
    const streakData = db.getStreakData(user.id);

    res.json({
      streakDays: user.streakDays,
      longestStreakDays: user.longestStreakDays,
      days: streakData,
    });
  } catch (error) {
    console.error("Error in /me/streak endpoint:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Set active course endpoint
app.put(["/me/active-course", "/api/me/active-course"], (req, res) => {
  try {
    const users = db.getAllUsers();
    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const { courseId } = req.body;
    const course = db.getCourseById(courseId);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Update user's active course (in a real DB this would be persisted)
    const userIndex = db.users.findIndex((u) => u.id === users[0].id);
    if (userIndex !== -1) {
      db.users[userIndex].activeCourseId = courseId;
    }

    const updatedUser = db.getAllUsers()[0];
    const activeCourse = db.getCourseById(courseId);

    res.json({
      id: updatedUser.id,
      username: updatedUser.username,
      displayName: updatedUser.displayName,
      avatarColor: updatedUser.avatarColor,
      xp: updatedUser.xp,
      gems: updatedUser.gems,
      hearts: updatedUser.hearts,
      maxHearts: updatedUser.maxHearts,
      heartsRefillAt: updatedUser.heartsRefillAt,
      streakDays: updatedUser.streakDays,
      league: updatedUser.league,
      dailyGoalXp: updatedUser.dailyGoalXp,
      activeCourseId: updatedUser.activeCourseId,
      activeCourse,
    });
  } catch (error) {
    console.error("Error in /me/active-course endpoint:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Courses endpoints
app.get(["/courses", "/api/courses"], (req, res) => {
  try {
    const courses = db.getAllCourses();
    const coursesWithCounts = courses.map((course) => ({
      ...course,
      learnerCount: db.getCourseLearnerCount(course.id),
    }));
    res.json(coursesWithCounts);
  } catch (error) {
    console.error("Error in courses endpoint:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get(["/courses/:courseId", "/api/courses/:courseId"], (req, res) => {
  try {
    const courseId = Array.isArray(req.params.courseId)
      ? req.params.courseId[0]
      : req.params.courseId;
    const course = db.getCourseById(courseId);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    const courseWithCount = {
      ...course,
      learnerCount: db.getCourseLearnerCount(courseId),
    };

    const units = db.getUnitsByCourseId(courseId);
    const lessons = db.getLessonsByCourseId(courseId);

    const unitsWithLessons = units.map((unit) => ({
      ...unit,
      lessons: lessons
        .filter((lesson) => lesson.unitId === unit.id)
        .map((lesson, lessonIndex) => {
          const progress = db.getUserLessonProgressByLesson(
            "user_3DUxScG8wxvQHYCytfdugCdxEuR",
            lesson.id,
          );
          const exercises = db.getExercisesByLessonId(lesson.id);

          // First lesson of first unit should be unlocked
          const isFirstLessonOfFirstUnit =
            unit.order === 1 && lessonIndex === 0;

          // Check if previous lesson in this unit is completed
          let previousLessonCompleted = false;
          if (lessonIndex > 0) {
            const previousLesson = lessons
              .filter((l) => l.unitId === unit.id)
              .find((l) => l.order === lesson.order - 1);
            if (previousLesson) {
              const previousProgress = db.getUserLessonProgressByLesson(
                "user_3DUxScG8wxvQHYCytfdugCdxEuR",
                previousLesson.id,
              );
              previousLessonCompleted = !!previousProgress;
            }
          }

          // Check if previous unit is completed (for first lesson of new units)
          let previousUnitCompleted = false;
          if (unit.order > 1 && lessonIndex === 0) {
            const previousUnit = units.find((u) => u.order === unit.order - 1);
            if (previousUnit) {
              const previousUnitLessons = lessons
                .filter((l) => l.unitId === previousUnit.id)
                .sort((a, b) => a.order - b.order);
              previousUnitCompleted = previousUnitLessons.every((lesson) => {
                const lessonProgress = db.getUserLessonProgressByLesson(
                  "user_3DUxScG8wxvQHYCytfdugCdxEuR",
                  lesson.id,
                );
                return !!lessonProgress;
              });
            }
          }

          const isUnlocked =
            isFirstLessonOfFirstUnit ||
            (lessonIndex === 0 && previousUnitCompleted) ||
            (lessonIndex > 0 && previousLessonCompleted);

          return {
            ...lesson,
            exerciseCount: exercises.length,
            completedCount: progress ? exercises.length : 0,
            crowns: progress?.crowns ?? 0,
            locked: !isUnlocked,
          };
        }),
    }));

    res.json({
      course: courseWithCount,
      units: unitsWithLessons,
    });
  } catch (error) {
    console.error("Error in course detail endpoint:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Achievements endpoint
app.get(["/achievements", "/api/achievements"], (req, res) => {
  try {
    const achievements = db.getAllAchievements();
    res.json(achievements);
  } catch (error) {
    console.error("Error in achievements endpoint:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Shop items endpoint
app.get(["/shop", "/api/shop"], (req, res) => {
  try {
    const shopItems = db.getAllShopItems();
    res.json(shopItems);
  } catch (error) {
    console.error("Error in shop endpoint:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Shop items endpoint with ownership status
app.get(["/shop/items", "/api/shop/items"], (req, res) => {
  try {
    const users = db.getAllUsers();
    const items = db.getAllShopItems();

    // For simplicity, assume user owns no items (in real app this would be tracked)
    const ownedSet = new Set();

    res.json(
      items.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        priceGems: item.priceGems,
        category: item.category,
        owned: ownedSet.has(item.id),
      })),
    );
  } catch (error) {
    console.error("Error in shop items endpoint:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Shop purchase endpoint
app.post(["/shop/purchase", "/api/shop/purchase"], (req, res) => {
  try {
    const users = db.getAllUsers();
    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const { itemId } = req.body;
    if (!itemId) {
      return res.status(400).json({ error: "Item ID is required" });
    }

    const item = db.getShopItemById(itemId);
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    const user = users[0];
    if (user.gems < item.priceGems) {
      return res.status(400).json({ error: "Not enough gems" });
    }

    // Update user's gems (in a real DB this would be persisted)
    const userIndex = db.users.findIndex((u) => u.id === user.id);
    if (userIndex !== -1) {
      db.users[userIndex].gems -= item.priceGems;
    }

    const updatedUser = db.getAllUsers()[0];

    res.json({
      user: updatedUser,
      item: item,
    });
  } catch (error) {
    console.error("Error in shop purchase endpoint:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Lesson detail endpoint
app.get(["/lessons/:lessonId", "/api/lessons/:lessonId"], (req, res) => {
  try {
    const lessonId = Array.isArray(req.params.lessonId)
      ? req.params.lessonId[0]
      : req.params.lessonId;
    const lesson = db.lessons.find((l) => l.id === lessonId);
    if (!lesson) {
      return res.status(404).json({ error: "Lesson not found" });
    }

    const course = db.getCourseById(lesson.courseId);
    const exercises = db.getExercisesByLessonId(lessonId);

    res.json({
      id: lesson.id,
      title: lesson.title,
      unitId: lesson.unitId,
      courseId: lesson.courseId,
      accentColor: course?.accentColor || "#58cc02",
      exercises: exercises.map((e) => ({
        id: e.id,
        order: e.order,
        kind: e.kind,
        prompt: e.prompt,
        promptTranslation: e.promptTranslation || null,
        audioUrl: e.audioUrl || null,
        choices: e.choices || null,
        wordBank: e.wordBank || null,
        pairs: e.pairs || null,
        hint: e.hint || null,
        correctAnswer: e.correctAnswer || null,
      })),
    });
  } catch (error) {
    console.error("Error in lesson endpoint:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Exercise answer checking endpoint
app.post(
  ["/exercises/:exerciseId/answer", "/api/exercises/:exerciseId/answer"],
  (req, res) => {
    try {
      const exerciseId = Array.isArray(req.params.exerciseId)
        ? req.params.exerciseId[0]
        : req.params.exerciseId;
      const { answer } = req.body;

      if (!answer) {
        return res.status(400).json({ error: "Answer is required" });
      }

      const exercise = db.exercises.find((e) => e.id === exerciseId);
      if (!exercise) {
        return res.status(404).json({ error: "Exercise not found" });
      }

      // Convert choice ID to actual text if needed
      let actualAnswer = answer;
      if (exercise.choices && Array.isArray(exercise.choices)) {
        const choice = exercise.choices.find((c) => c.id === answer);
        if (choice) {
          actualAnswer = choice.text;
        }
      }

      const normalize = (s) =>
        s
          .trim()
          .toLowerCase()
          .replace(/[¿¡.,!?]/g, "")
          .replace(/\s+/g, " ");
      const accepted = [
        exercise.correctAnswer,
        ...(exercise.acceptedAnswers || []),
      ].map(normalize);
      const correct = accepted.includes(normalize(actualAnswer));

      res.json({
        correct,
        correctAnswer: exercise.correctAnswer,
        explanation: exercise.explanation || null,
      });
    } catch (error) {
      console.error("Error in exercise answer endpoint:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
);

// Lesson completion endpoint
app.post(
  ["/lessons/:lessonId/complete", "/api/lessons/:lessonId/complete"],
  (req, res) => {
    try {
      const lessonId = Array.isArray(req.params.lessonId)
        ? req.params.lessonId[0]
        : req.params.lessonId;
      const { correctCount, totalCount, timeSeconds } = req.body;

      const lesson = db.lessons.find((l) => l.id === lessonId);
      if (!lesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }

      const users = db.getAllUsers();
      if (users.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      const user = users[0];

      // Calculate XP and rewards
      const baseXp = 10;
      const wrongCount = totalCount - correctCount;
      const perfect = wrongCount === 0;
      const perfectBonusXp = perfect ? 5 : 0;
      const gemsAwarded = perfect ? 5 : 2;

      const newHearts = Math.max(0, user.hearts - wrongCount);
      const xpAwarded = baseXp + perfectBonusXp;
      const newXp = user.xp + xpAwarded;

      // Update user stats (in real DB this would be persisted)
      const userIndex = db.users.findIndex((u) => u.id === user.id);
      if (userIndex !== -1) {
        db.users[userIndex].xp = newXp;
        db.users[userIndex].gems = user.gems + gemsAwarded;
        db.users[userIndex].hearts = newHearts;
      }

      // Add lesson run record
      const todayIso = new Date().toISOString().slice(0, 10);
      const lessonRun = {
        id: `run_${Date.now()}`,
        userId: user.id,
        lessonId,
        date: todayIso,
        xpEarned: xpAwarded,
        correctCount,
        totalCount,
        timeSeconds,
      };
      db.lessonRuns.push(lessonRun);

      // Update or create lesson progress
      const existingProgress = db.getUserLessonProgressByLesson(
        user.id,
        lessonId,
      );
      if (!existingProgress) {
        db.userLessonProgress.push({
          id: `progress_${Date.now()}`,
          userId: user.id,
          lessonId,
          crowns: perfect ? 2 : 1,
          perfect,
          completedAt: new Date().toISOString(),
        });
      }

      const updatedUser = db.getAllUsers()[0];
      const activeCourse = db.getCourseById(updatedUser.activeCourseId);

      res.json({
        xpAwarded,
        bonusXp: perfectBonusXp,
        newStreakDays: updatedUser.streakDays,
        heartsRemaining: newHearts,
        leveledUp: Math.floor(newXp / 100) > Math.floor(user.xp / 100),
        gemsAwarded,
        profile: {
          id: updatedUser.id,
          username: updatedUser.username,
          displayName: updatedUser.displayName,
          avatarColor: updatedUser.avatarColor,
          xp: updatedUser.xp,
          gems: updatedUser.gems,
          hearts: updatedUser.hearts,
          maxHearts: updatedUser.maxHearts,
          heartsRefillAt: updatedUser.heartsRefillAt,
          streakDays: updatedUser.streakDays,
          league: updatedUser.league,
          dailyGoalXp: updatedUser.dailyGoalXp,
          activeCourseId: updatedUser.activeCourseId,
          activeCourse,
        },
      });
    } catch (error) {
      console.error("Error in lesson completion endpoint:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
);

// Leaderboard endpoint
app.get(["/leaderboard", "/api/leaderboard"], (req, res) => {
  try {
    const { league } = req.query;
    const users = db.getAllUsers();
    if (users.length === 0) {
      return res.json({
        league: league || "bronze",
        weekEndsAt: new Date().toISOString(),
        entries: [],
      });
    }

    const user = users[0];
    const userLeague = league || user.league;

    // Calculate weekly XP for all real users
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);

    const allEntries = users.map((u) => {
      const runs = db.getUserLessonRuns(u.id);
      const weeklyXp = runs
        .filter((r) => new Date(r.date) >= cutoff)
        .reduce((sum, r) => sum + r.xpEarned, 0);

      return {
        userId: u.id,
        displayName: u.displayName,
        avatarColor: u.avatarColor,
        weeklyXp: weeklyXp,
        isMe: u.id === user.id,
      };
    });

    // Filter by league if specified
    const leagueEntries = league
      ? allEntries.filter((e) => {
          const userData = users.find((u) => u.id === e.userId);
          return userData?.league === league;
        })
      : allEntries;

    leagueEntries.sort((a, b) => b.weeklyXp - a.weeklyXp);
    const ranked = leagueEntries.map((e, i) => ({ rank: i + 1, ...e }));

    const weekEnd = new Date();
    const dayOfWeek = weekEnd.getDay();
    const daysUntilSunday = (7 - dayOfWeek) % 7 || 7;
    weekEnd.setDate(weekEnd.getDate() + daysUntilSunday);
    weekEnd.setHours(23, 59, 59, 0);

    res.json({
      league: userLeague,
      weekEndsAt: weekEnd.toISOString(),
      entries: ranked,
    });
  } catch (error) {
    console.error("Error in leaderboard endpoint:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// AI Progress Analysis endpoint
app.get(["/ai/progress", "/api/ai/progress"], (req, res) => {
  try {
    const users = db.getAllUsers();
    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const user = users[0];

    const progress = db.getUserLessonProgress(user.id);
    const runs = db.getUserLessonRuns(user.id);
    const stats = db.getUserStats(user.id);
    const weeklyXp = db.getWeeklyXp(user.id);
    const streakData = db.getStreakData(user.id);

    // Calculate completion rate
    const totalLessons = db.lessons.filter(
      (l) => l.courseId === user.activeCourseId,
    ).length;
    const completionRate =
      totalLessons > 0 ? (progress.length / totalLessons) * 100 : 0;

    // Calculate average accuracy
    const perfectRate =
      progress.length > 0 ? (stats.perfectLessons / progress.length) * 100 : 0;

    // Identify weak areas (lessons with low crowns)
    const weakLessons = progress
      .filter((p) => p.crowns < 2)
      .map((p) => {
        const lesson = db.lessons.find((l) => l.id === p.lessonId);
        return lesson
          ? { id: lesson.id, title: lesson.title, crowns: p.crowns }
          : null;
      })
      .filter(Boolean);

    // Calculate study consistency (days with activity in last week)
    const lastWeekActivity = streakData
      .slice(-7)
      .filter((d) => d.completed).length;

    res.json({
      overallProgress: {
        completionRate: Math.round(completionRate),
        totalLessons,
        completedLessons: progress.length,
        totalXp: stats.totalXp,
        perfectRate: Math.round(perfectRate),
      },
      weeklyAnalysis: {
        weeklyXp,
        totalWeeklyXp: weeklyXp.reduce((sum, day) => sum + day.xp, 0),
        studyConsistency: `${lastWeekActivity}/7 days`,
        streakDays: user.streakDays,
        longestStreakDays: user.longestStreakDays,
      },
      weakAreas: weakLessons,
      recommendations: generateRecommendations(
        stats,
        progress,
        weakLessons,
        lastWeekActivity,
      ),
    });
  } catch (error) {
    console.error("Error in AI progress endpoint:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// AI Lesson Recommendation endpoint
app.get(["/ai/recommend-lesson", "/api/ai/recommend-lesson"], (req, res) => {
  try {
    const users = db.getAllUsers();
    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const user = users[0];

    if (!user.activeCourseId) {
      return res.json({
        recommendation: null,
        reason: "No active course selected",
      });
    }

    const lessons = db.getLessonsByCourseId(user.activeCourseId);
    const units = db.getUnitsByCourseId(user.activeCourseId);
    const progress = db.getUserLessonProgress(user.id);

    // Find next incomplete lesson
    for (const unit of units) {
      const unitLessons = lessons
        .filter((l) => l.unitId === unit.id)
        .sort((a, b) => a.order - b.order);

      for (const lesson of unitLessons) {
        const lessonProgress = progress.find((p) => p.lessonId === lesson.id);
        if (!lessonProgress) {
          // Check if lesson is unlocked
          const isFirstLessonOfFirstUnit =
            unit.order === 1 && lesson.order === 1;
          const previousLesson = unitLessons.find(
            (l) => l.order === lesson.order - 1,
          );
          const previousProgress = previousLesson
            ? progress.find((p) => p.lessonId === previousLesson.id)
            : null;
          const isUnlocked = isFirstLessonOfFirstUnit || previousProgress;

          if (isUnlocked) {
            return res.json({
              recommendation: {
                lessonId: lesson.id,
                title: lesson.title,
                unitId: unit.id,
                unitTitle: unit.title,
                reason: "Next lesson in your learning path",
                priority: "high",
              },
            });
          }
        } else if (lessonProgress.crowns < 2) {
          // Recommend improving weak lessons
          return res.json({
            recommendation: {
              lessonId: lesson.id,
              title: lesson.title,
              unitId: unit.id,
              unitTitle: unit.title,
              reason: "Improve your score to earn more crowns",
              priority: "medium",
            },
          });
        }
      }
    }

    // All lessons completed
    return res.json({
      recommendation: null,
      reason: "You've completed all lessons in this course!",
    });
  } catch (error) {
    console.error("Error in AI recommend lesson endpoint:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Helper function to generate AI recommendations
function generateRecommendations(
  stats,
  progress,
  weakLessons,
  studyConsistency,
) {
  const recommendations = [];

  if (stats.perfectLessons < progress.length * 0.5) {
    recommendations.push({
      type: "accuracy",
      message: "Focus on accuracy - try to get more perfect lessons",
      priority: "medium",
    });
  }

  if (weakLessons.length > 0) {
    recommendations.push({
      type: "review",
      message: `Review ${weakLessons.length} lesson(s) with low scores to improve`,
      priority: "high",
    });
  }

  if (studyConsistency < 4) {
    recommendations.push({
      type: "consistency",
      message: "Study more consistently - aim for at least 4 days per week",
      priority: "medium",
    });
  }

  if (stats.streakDays < 3) {
    recommendations.push({
      type: "streak",
      message: "Build your streak by studying daily",
      priority: "low",
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      type: "encouragement",
      message: "Great progress! Keep up the excellent work!",
      priority: "low",
    });
  }

  return recommendations;
}

// Health check endpoint
app.get(["/healthz", "/api/healthz"], (req, res) => {
  try {
    res.json({ status: "ok" });
  } catch (error) {
    console.error("Error in health check endpoint:", error);
    res.status(500).json({ status: "error" });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ CUSTOM SERVER IS RUNNING at http://localhost:${PORT}`);
  console.log(`📂 Database loaded from JSON files`);
});
