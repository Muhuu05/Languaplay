import { useQuery } from "@tanstack/react-query";

interface AIProgressAnalysis {
  overallProgress: {
    completionRate: number;
    totalLessons: number;
    completedLessons: number;
    totalXp: number;
    perfectRate: number;
  };
  weeklyAnalysis: {
    weeklyXp: Array<{ day: string; xp: number }>;
    totalWeeklyXp: number;
    studyConsistency: string;
    streakDays: number;
    longestStreakDays: number;
  };
  weakAreas: Array<{ id: string; title: string; crowns: number }>;
  recommendations: Array<{
    type: string;
    message: string;
    priority: string;
  }>;
}

interface LessonRecommendation {
  recommendation: {
    lessonId: string;
    title: string;
    unitId: string;
    unitTitle: string;
    reason: string;
    priority: string;
  } | null;
  reason: string;
}

async function fetchAPI<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}

export function useAIProgressAnalysis() {
  return useQuery({
    queryKey: ["ai-progress"],
    queryFn: async () => {
      return fetchAPI<AIProgressAnalysis>("/api/ai/progress");
    },
  });
}

export function useAILessonRecommendation() {
  return useQuery({
    queryKey: ["ai-recommend-lesson"],
    queryFn: async () => {
      return fetchAPI<LessonRecommendation>("/api/ai/recommend-lesson");
    },
  });
}
