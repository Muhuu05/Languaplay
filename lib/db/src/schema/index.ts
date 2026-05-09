import {
  pgTable,
  text,
  integer,
  timestamp,
  boolean,
  jsonb,
  date,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull(),
  displayName: text("display_name").notNull(),
  avatarColor: text("avatar_color").notNull(),
  xp: integer("xp").notNull().default(0),
  gems: integer("gems").notNull().default(500),
  hearts: integer("hearts").notNull().default(5),
  maxHearts: integer("max_hearts").notNull().default(5),
  heartsRefillAt: timestamp("hearts_refill_at", { withTimezone: true }),
  streakDays: integer("streak_days").notNull().default(0),
  longestStreakDays: integer("longest_streak_days").notNull().default(0),
  league: text("league").notNull().default("bronze"),
  dailyGoalXp: integer("daily_goal_xp").notNull().default(20),
  activeCourseId: text("active_course_id"),
  lastActiveDate: date("last_active_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const courses = pgTable("courses", {
  id: text("id").primaryKey(),
  languageCode: text("language_code").notNull(),
  languageName: text("language_name").notNull(),
  flagEmoji: text("flag_emoji").notNull(),
  accentColor: text("accent_color").notNull(),
  learnerCount: integer("learner_count").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const units = pgTable("units", {
  id: text("id").primaryKey(),
  courseId: text("course_id").notNull(),
  order: integer("order").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  color: text("color").notNull(),
});

export const lessons = pgTable("lessons", {
  id: text("id").primaryKey(),
  unitId: text("unit_id").notNull(),
  courseId: text("course_id").notNull(),
  order: integer("order").notNull(),
  title: text("title").notNull(),
  kind: text("kind").notNull().default("lesson"),
});

export const exercises = pgTable("exercises", {
  id: text("id").primaryKey(),
  lessonId: text("lesson_id").notNull(),
  order: integer("order").notNull(),
  kind: text("kind").notNull(),
  prompt: text("prompt").notNull(),
  promptTranslation: text("prompt_translation"),
  audioUrl: text("audio_url"),
  correctAnswer: text("correct_answer").notNull(),
  acceptedAnswers: jsonb("accepted_answers").$type<string[]>(),
  choices: jsonb("choices").$type<Array<{ id: string; text: string; imageUrl?: string }> | null>(),
  wordBank: jsonb("word_bank").$type<string[] | null>(),
  pairs: jsonb("pairs").$type<Array<{ left: string; right: string }> | null>(),
  hint: text("hint"),
  explanation: text("explanation"),
});

export const userLessonProgress = pgTable(
  "user_lesson_progress",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    lessonId: text("lesson_id").notNull(),
    crowns: integer("crowns").notNull().default(0),
    completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
    perfect: boolean("perfect").notNull().default(false),
  },
  (t) => ({
    userLessonIdx: uniqueIndex("user_lesson_idx").on(t.userId, t.lessonId),
  }),
);

export const lessonRuns = pgTable("lesson_runs", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  lessonId: text("lesson_id").notNull(),
  date: date("date").notNull(),
  xpEarned: integer("xp_earned").notNull(),
  correctCount: integer("correct_count").notNull(),
  totalCount: integer("total_count").notNull(),
  timeSeconds: integer("time_seconds").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const achievements = pgTable("achievements", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  tier: text("tier").notNull(),
  target: integer("target").notNull(),
  metric: text("metric").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const shopItems = pgTable("shop_items", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  priceGems: integer("price_gems").notNull(),
  category: text("category").notNull(),
  effect: text("effect").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const userInventory = pgTable(
  "user_inventory",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    itemId: text("item_id").notNull(),
    acquiredAt: timestamp("acquired_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userItemIdx: uniqueIndex("user_item_idx").on(t.userId, t.itemId),
  }),
);

export const leaderboardUsers = pgTable("leaderboard_users", {
  id: text("id").primaryKey(),
  displayName: text("display_name").notNull(),
  avatarColor: text("avatar_color").notNull(),
  weeklyXp: integer("weekly_xp").notNull(),
  league: text("league").notNull(),
});
