import { useAILessonRecommendation } from "@/hooks/use-ai";
import { Loader2, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export function AILessonRecommendation() {
  const { data, isLoading, error } = useAILessonRecommendation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return null;
  }

  const { recommendation, reason } = data;

  if (!recommendation) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-2xl border-2 border-green-200 dark:border-green-800 p-6">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-green-500" />
          <div>
            <h3 className="font-bold text-green-900 dark:text-green-100">Баяр хүргэе!</h3>
            <p className="text-sm text-green-700 dark:text-green-300">{reason}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-2xl border-2 border-purple-200 dark:border-purple-800 p-6">
      <div className="flex items-start gap-4">
        <div className="shrink-0">
          <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2 py-1 rounded-full bg-purple-200 dark:bg-purple-800 text-purple-900 dark:text-purple-100">
              AI Зөвлөмж
            </span>
            <span className="text-xs text-muted-foreground">{recommendation.priority === "high" ? "Өндөр" : "Дунд"}</span>
          </div>
          <h3 className="font-bold text-lg mb-1">{recommendation.title}</h3>
          <p className="text-sm text-muted-foreground mb-3">
            {recommendation.unitTitle} • {recommendation.reason}
          </p>
          <Link
            href={`/lesson/${recommendation.lessonId}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 transition-colors"
          >
            Эхлэх
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
