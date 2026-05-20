import { useAIProgressAnalysis } from "@/hooks/use-ai";
import { Loader2, TrendingUp, Flame, BookOpen, AlertCircle, CheckCircle, Lightbulb } from "lucide-react";

export function AIProgressAnalysis() {
  const { data, isLoading, error } = useAIProgressAnalysis();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return null;
  }

  const { overallProgress, weeklyAnalysis, weakAreas, recommendations } = data;

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <div className="bg-card rounded-2xl border-2 border-border p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Нийт дэвшил
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-black text-primary">{overallProgress.completionRate}%</div>
            <div className="text-sm text-muted-foreground">Дууссан</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-black">{overallProgress.completedLessons}/{overallProgress.totalLessons}</div>
            <div className="text-sm text-muted-foreground">Хичээл</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-black text-amber-500">{overallProgress.totalXp}</div>
            <div className="text-sm text-muted-foreground">XP</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-black text-green-500">{overallProgress.perfectRate}%</div>
            <div className="text-sm text-muted-foreground">Төгс</div>
          </div>
        </div>
      </div>

      {/* Weekly Analysis */}
      <div className="bg-card rounded-2xl border-2 border-border p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          7 хоногийн дүн
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Нийт XP:</span>
            <span className="font-bold text-lg">{weeklyAnalysis.totalWeeklyXp}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Суралцах тогтвортой байдал:</span>
            <span className="font-bold text-lg">{weeklyAnalysis.studyConsistency}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Цуваа:</span>
            <span className="font-bold text-lg flex items-center gap-1">
              <Flame className="w-4 h-4 text-orange-500" />
              {weeklyAnalysis.streakDays} өдөр
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Хамгийн урт цуваа:</span>
            <span className="font-bold text-lg">{weeklyAnalysis.longestStreakDays} өдөр</span>
          </div>
          
          {/* Weekly XP Chart */}
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-end justify-between gap-2 h-24">
              {weeklyAnalysis.weeklyXp.map((day, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-primary rounded-t transition-all"
                    style={{
                      height: `${Math.max(4, (day.xp / (weeklyAnalysis.totalWeeklyXp || 1)) * 100)}%`,
                      minHeight: day.xp > 0 ? '16px' : '4px',
                      opacity: day.xp > 0 ? 1 : 0.3,
                    }}
                  />
                  <div className="text-xs text-muted-foreground mt-1">{day.day}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Weak Areas */}
      {weakAreas.length > 0 && (
        <div className="bg-card rounded-2xl border-2 border-border p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            Сул тал
          </h3>
          <div className="space-y-2">
            {weakAreas.map((area) => (
              <div key={area.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="font-medium">{area.title}</span>
                <div className="flex items-center gap-1">
                  {[...Array(2)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-4 h-4 rounded-full ${
                        i < area.crowns ? "bg-amber-400" : "bg-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Recommendations */}
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-2xl border-2 border-purple-200 dark:border-purple-800 p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-purple-500" />
          AI Зөвлөмж
        </h3>
        <div className="space-y-3">
          {recommendations.map((rec, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 p-3 rounded-lg ${
                rec.priority === "high"
                  ? "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800"
                  : rec.priority === "medium"
                  ? "bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800"
                  : "bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800"
              }`}
            >
              {rec.type === "encouragement" ? (
                <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              ) : (
                <Lightbulb className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
              )}
              <p className="text-sm">{rec.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
