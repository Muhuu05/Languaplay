import fs from 'fs';
import path from 'path';

// Helper to convert snake_case to camelCase
function toCamelCase(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => toCamelCase(item));
  }
  
  const result: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      result[camelKey] = toCamelCase(obj[key]);
    }
  }
  return result;
}

// Load and parse JSON files
function loadJsonFile(filename: string): any[] {
  try {
    const filePath = path.join(process.cwd(), '..', '..', filename);
    if (!fs.existsSync(filePath)) {
      console.warn(`File not found: ${filePath}`);
      return [];
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading ${filename}:`, error);
    return [];
  }
}

// Database interface that mimics the real database
export class JsonDatabase {
  private users: any[] = [];
  private courses: any[] = [];
  private units: any[] = [];
  private lessons: any[] = [];
  private exercises: any[] = [];
  private achievements: any[] = [];
  private shopItems: any[] = [];
  private leaderboardUsers: any[] = [];
  private lessonRuns: any[] = [];
  private userLessonProgress: any[] = [];

  constructor() {
    this.loadAllData();
  }

  private loadAllData() {
    this.users = toCamelCase(loadJsonFile('users.json'));
    this.courses = toCamelCase(loadJsonFile('courses.json'));
    this.units = toCamelCase(loadJsonFile('units.json'));
    this.lessons = toCamelCase(loadJsonFile('lessons.json'));
    this.exercises = toCamelCase(loadJsonFile('exercises.json'));
    this.achievements = toCamelCase(loadJsonFile('achievements.json'));
    this.shopItems = toCamelCase(loadJsonFile('shop_items.json'));
    this.leaderboardUsers = toCamelCase(loadJsonFile('leaderboard_users.json'));
    this.lessonRuns = toCamelCase(loadJsonFile('lesson_runs.json'));
    this.userLessonProgress = toCamelCase(loadJsonFile('user_lesson_progress.json'));
  }

  // User operations
  getUserById(id: string) {
    return this.users.find(user => user.id === id);
  }

  getAllUsers() {
    return this.users;
  }

  // Course operations
  getAllCourses() {
    return this.courses.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  getCourseById(id: string) {
    return this.courses.find(course => course.id === id);
  }

  getCourseLearnerCount(courseId: string) {
    return this.users.filter(user => user.activeCourseId === courseId).length;
  }

  // Unit operations
  getUnitsByCourseId(courseId: string) {
    return this.units.filter(unit => unit.courseId === courseId).sort((a, b) => a.order - b.order);
  }

  // Lesson operations
  getLessonsByCourseId(courseId: string) {
    return this.lessons.filter(lesson => lesson.courseId === courseId).sort((a, b) => a.order - b.order);
  }

  getLessonsByUnitId(unitId: string) {
    return this.lessons.filter(lesson => lesson.unitId === unitId).sort((a, b) => a.order - b.order);
  }

  // Exercise operations
  getExercisesByLessonId(lessonId: string) {
    return this.exercises.filter(exercise => exercise.lessonId === lessonId).sort((a, b) => a.order - b.order);
  }

  // Achievement operations
  getAllAchievements() {
    return this.achievements.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  // Shop operations
  getAllShopItems() {
    return this.shopItems.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  // Leaderboard operations
  getLeaderboardUsers() {
    return this.leaderboardUsers.sort((a, b) => b.weeklyXp - a.weeklyXp);
  }

  // User progress operations
  getUserLessonProgress(userId: string) {
    return this.userLessonProgress.filter(progress => progress.userId === userId);
  }

  getUserLessonProgressByLesson(userId: string, lessonId: string) {
    return this.userLessonProgress.find(progress => 
      progress.userId === userId && progress.lessonId === lessonId
    );
  }

  // Lesson runs operations
  getUserLessonRuns(userId: string) {
    return this.lessonRuns.filter(run => run.userId === userId);
  }

  getUserLessonRunsByDate(userId: string, date: string) {
    return this.lessonRuns.filter(run => run.userId === userId && run.date === date);
  }

  // Stats operations
  getUserStats(userId: string) {
    const user = this.getUserById(userId);
    if (!user) return null;

    const progress = this.getUserLessonProgress(userId);
    const runs = this.getUserLessonRuns(userId);

    const lessonsCompleted = progress.length;
    const perfectLessons = progress.filter(p => p.perfect).length;
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
  }

  getWeeklyXp(userId: string) {
    const runs = this.getUserLessonRuns(userId);
    const today = new Date();
    const weeklyXp = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
      const xp = runs
        .filter(run => run.date === iso)
        .reduce((sum, run) => sum + run.xpEarned, 0);
      weeklyXp.push({ day: dayName, xp });
    }

    return weeklyXp;
  }

  getStreakData(userId: string) {
    const runs = this.getUserLessonRuns(userId);
    const today = new Date();
    const days = [];

    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const xp = runs
        .filter(run => run.date === iso)
        .reduce((sum, run) => sum + run.xpEarned, 0);
      days.push({ date: iso, xp, completed: xp > 0 });
    }

    return days;
  }

  getDailyGoal(userId: string) {
    const user = this.getUserById(userId);
    if (!user) return { goalXp: 20, earnedTodayXp: 0 };

    const todayIso = new Date().toISOString().slice(0, 10);
    const todayRuns = this.getUserLessonRunsByDate(userId, todayIso);
    const earnedTodayXp = todayRuns.reduce((sum, run) => sum + run.xpEarned, 0);

    return {
      goalXp: user.dailyGoalXp,
      earnedTodayXp,
    };
  }
}

export const db = new JsonDatabase();
