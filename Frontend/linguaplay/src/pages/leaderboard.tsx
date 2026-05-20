import { useGetLeaderboard } from "@workspace/api-client-react";
import { Loader2, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

const LEAGUE_NAMES_MN: Record<string, string> = {
  bronze: "Хүрэл",
  silver: "Мөнгө",
  gold: "Алт",
  sapphire: "Индранил",
  ruby: "Бадмаараг",
  emerald: "Маргад",
  diamond: "Алмаз",
};

export default function Leaderboard() {
  const { data: leaderboard, isLoading } = useGetLeaderboard();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!leaderboard) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-purple-100 border-4 border-purple-300 mb-4 shadow-sm">
          <Trophy className="w-12 h-12 text-purple-500" />
        </div>
        <h1 className="text-3xl font-black">{LEAGUE_NAMES_MN[leaderboard.league] || leaderboard.league} лиг</h1>
        <p className="text-muted-foreground font-medium mt-2">
          Тэргүүн 10 нь дараагийн лигт давшина
        </p>
      </div>

      <div className="space-y-2">
        {leaderboard.entries.map((entry) => (
          <div
            key={entry.userId}
            className={cn(
              "flex items-center p-4 rounded-2xl border-2 transition-all",
              entry.isMe
                ? "bg-primary/10 border-primary shadow-sm"
                : "bg-card border-border"
            )}
          >
            <div className="w-8 text-center font-bold text-muted-foreground">
              {entry.rank}
            </div>
            <div
              className="w-12 h-12 rounded-full mx-4 flex items-center justify-center text-white font-bold text-xl border-2 border-black/10"
              style={{ backgroundColor: entry.avatarColor }}
            >
              {entry.displayName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 font-bold text-lg">
              {entry.displayName}
              {entry.isMe && <span className="ml-2 text-sm text-primary">(Та)</span>}
            </div>
            <div className="font-bold text-primary">
              {entry.weeklyXp} XP
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
