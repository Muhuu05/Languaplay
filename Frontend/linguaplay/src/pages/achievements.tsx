import { useListAchievements } from "@workspace/api-client-react";
import { Loader2, Award, Flame, Star, Trophy, Zap, Target } from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ElementType> = {
  flame: Flame,
  star: Star,
  trophy: Trophy,
  zap: Zap,
  target: Target,
  default: Award,
};

export default function Achievements() {
  const { data: achievements, isLoading } = useListAchievements();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-black">Амжилт</h1>
        <p className="text-muted-foreground font-medium mt-2">
          Сорилтыг даван туулж тэмдэг ав
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {achievements?.map((achievement) => {
          const Icon = iconMap[achievement.icon] || iconMap.default;
          const progressPercent = Math.min(
            100,
            (achievement.progress / achievement.target) * 100
          );

          return (
            <div
              key={achievement.id}
              className={cn(
                "p-6 rounded-2xl border-2 border-b-4 flex items-center gap-4",
                achievement.unlocked
                  ? "bg-card border-border"
                  : "bg-muted/50 border-muted opacity-75 grayscale"
              )}
            >
              <div
                className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center border-4 shadow-sm shrink-0",
                  achievement.tier === "gold"
                    ? "bg-yellow-100 border-yellow-400 text-yellow-600"
                    : achievement.tier === "silver"
                    ? "bg-slate-100 border-slate-300 text-slate-500"
                    : "bg-orange-100 border-orange-300 text-orange-600"
                )}
              >
                <Icon className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg">{achievement.title}</h3>
                <p className="text-sm text-muted-foreground font-medium">
                  {achievement.description}
                </p>
                <div className="mt-3">
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-muted-foreground">Явц</span>
                    <span>
                      {achievement.progress} / {achievement.target}
                    </span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
