import {
  useGetMe,
  useGetMyStats,
  useGetMyStreak,
} from "@workspace/api-client-react";
import {
  Loader2,
  Flame,
  Star,
  CheckCircle,
  BookOpen,
  Edit2,
  Zap,
} from "lucide-react";
import { Link } from "wouter";
import { computeLevel, XP_PER_LEVEL } from "@/lib/level";
import { AIProgressAnalysis } from "@/components/ai-progress-analysis";

const LEAGUE_NAMES_MN: Record<string, string> = {
  bronze: "Хүрэл",
  silver: "Мөнгө",
  gold: "Алт",
  sapphire: "Индранил",
  ruby: "Бадмаараг",
  emerald: "Маргад",
  diamond: "Алмаз",
};

export default function Profile() {
  const { data: user, isLoading: userLoading } = useGetMe();
  const { data: stats, isLoading: statsLoading } = useGetMyStats();
  const { data: streak, isLoading: streakLoading } = useGetMyStreak();

  const isLoading = userLoading || statsLoading || streakLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !stats || !streak) return null;

  const { level, xpInLevel, xpToNext, progress } = computeLevel(user.xp);

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <div className="flex items-center gap-6 p-6 bg-card rounded-3xl border-2 border-b-4 border-border">
        <div className="relative shrink-0">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-4xl border-4 border-black/10 shadow-sm"
            style={{ backgroundColor: user.avatarColor }}
          >
            {user.displayName.charAt(0).toUpperCase()}
          </div>
          <div className="absolute -bottom-1 -right-1 min-w-9 h-9 px-2 rounded-full bg-amber-400 border-4 border-card text-amber-950 font-black text-sm flex items-center justify-center shadow">
            {level}
          </div>
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-black">{user.displayName}</h1>
          <p className="text-muted-foreground font-medium">@{user.username}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-amber-100 text-amber-700 font-bold text-sm border-2 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
              <Zap className="w-3.5 h-3.5 mr-1 fill-amber-500 text-amber-500" />
              {level}-р түвшин
            </div>
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-purple-100 text-purple-700 font-bold text-sm border-2 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800">
              {LEAGUE_NAMES_MN[user.league] || user.league} лиг
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-3xl border-2 border-b-4 border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-amber-950/30 dark:to-yellow-900/20 dark:border-amber-800">
        <div className="flex items-end justify-between mb-3">
          <div>
            <div className="text-xs font-black text-amber-700 dark:text-amber-300 uppercase tracking-widest">
              Түвшин {level}
            </div>
            <div className="text-3xl font-black text-foreground mt-1">
              {xpInLevel}{" "}
              <span className="text-amber-600 dark:text-amber-400">
                / {XP_PER_LEVEL}
              </span>
              <span className="ml-2 text-base font-bold text-muted-foreground uppercase">
                XP
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-bold text-muted-foreground uppercase">
              Дараагийн түвшин
            </div>
            <div className="text-lg font-black text-amber-600 dark:text-amber-400">
              {xpToNext} XP үлдсэн
            </div>
          </div>
        </div>
        <div className="relative h-5 bg-amber-200/60 dark:bg-amber-950/60 rounded-full overflow-hidden border-2 border-amber-300/80 dark:border-amber-800">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full shadow-inner transition-all duration-700 ease-out"
            style={{ width: `${Math.max(4, progress * 100)}%` }}
          />
        </div>
        <p className="mt-3 text-sm font-medium text-amber-800/80 dark:text-amber-300/80">
          Цуваагаа үргэлжлүүлэхэд илүү XP олно — өдөр бүр сурснаар бонус
          нэмэгдэнэ.
        </p>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Статистик</h2>
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            icon={Flame}
            color="orange"
            value={stats.longestStreakDays}
            label="Хамгийн урт цуваа"
          />
          <StatCard
            icon={Star}
            color="yellow"
            value={stats.totalXp}
            label="Нийт XP"
          />
          <StatCard
            icon={CheckCircle}
            color="green"
            value={stats.lessonsCompleted}
            label="Дууссан хичээл"
          />
          <StatCard
            icon={BookOpen}
            color="blue"
            value={stats.wordsLearned}
            label="Сурсан үг"
          />
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-purple-500" />
          AI Дэвшлийн шинжилгээ
        </h2>
        <AIProgressAnalysis />
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Цуваагийн хуанли</h2>
        <div className="p-6 bg-card rounded-3xl border-2 border-border">
          <div className="grid grid-cols-7 gap-2">
            {["Ня", "Да", "Мя", "Лх", "Пү", "Ба", "Бя"].map((day, i) => (
              <div
                key={i}
                className="text-center text-sm font-bold text-muted-foreground pb-2"
              >
                {day}
              </div>
            ))}
            {streak.days.map((day, i) => (
              <div
                key={i}
                className={`aspect-square rounded-full flex items-center justify-center border-2 ${
                  day.completed
                    ? "bg-orange-100 border-orange-400 text-orange-500"
                    : "bg-muted border-transparent text-muted-foreground"
                }`}
              >
                {day.completed && <Flame className="w-5 h-5 fill-current" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <Link href="/goal">
          <div className="button-press inline-flex items-center justify-center px-6 py-3 rounded-xl bg-secondary text-secondary-foreground font-bold border-2 border-secondary-border cursor-pointer">
            <Edit2 className="w-4 h-4 mr-2" />
            Өдрийн зорилго засах
          </div>
        </Link>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  color,
  value,
  label,
}: {
  icon: any;
  color: string;
  value: number;
  label: string;
}) {
  const colorMap: Record<string, string> = {
    orange: "text-orange-500 fill-orange-500",
    yellow: "text-yellow-500 fill-yellow-500",
    green: "text-green-500 fill-green-500",
    blue: "text-blue-500 fill-blue-500",
  };

  return (
    <div className="p-4 rounded-2xl border-2 border-border bg-card flex items-center gap-4">
      <Icon className={`w-8 h-8 ${colorMap[color]}`} />
      <div>
        <div className="font-black text-xl">{value}</div>
        <div className="text-sm font-medium text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}
