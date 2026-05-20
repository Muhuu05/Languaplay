import { useGetDailyGoal, useSetDailyGoal, getGetDailyGoalQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Loader2, Target, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const goals = [
  { value: 10, label: "Энгийн", description: "Өдөрт 10 XP" },
  { value: 20, label: "Хэвийн", description: "Өдөрт 20 XP" },
  { value: 30, label: "Нухацтай", description: "Өдөрт 30 XP" },
  { value: 50, label: "Эрчимтэй", description: "Өдөрт 50 XP" },
] as const;

export default function Goal() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: currentGoal, isLoading } = useGetDailyGoal();
  const setGoal = useSetDailyGoal();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleSelectGoal = (goalXp: 10 | 20 | 30 | 50) => {
    setGoal.mutate(
      { data: { goalXp } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetDailyGoalQueryKey() });
          setLocation("/profile");
        },
      }
    );
  };

  return (
    <div className="max-w-lg mx-auto py-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 border-4 border-blue-200 mb-4">
          <Target className="w-10 h-10 text-blue-500" />
        </div>
        <h1 className="text-3xl font-black">Өдрийн зорилго</h1>
        <p className="text-muted-foreground font-medium mt-2">
          Өдөр бүр дасгал хийхэд өөрийгөө уриалаарай
        </p>
      </div>

      <div className="space-y-4">
        {goals.map((goal) => {
          const isSelected = currentGoal?.goalXp === goal.value;
          const isPending = setGoal.isPending && setGoal.variables?.data.goalXp === goal.value;

          return (
            <button
              key={goal.value}
              onClick={() => handleSelectGoal(goal.value)}
              disabled={setGoal.isPending}
              className={cn(
                "card-press w-full p-4 rounded-2xl border-2 flex items-center justify-between text-left transition-all",
                isSelected
                  ? "border-blue-500 bg-blue-50 cursor-default"
                  : "border-border bg-card hover:border-blue-300 border-b-4 cursor-pointer"
              )}
            >
              <div>
                <h3 className="font-bold text-lg">{goal.label}</h3>
                <p className="text-muted-foreground font-medium">{goal.description}</p>
              </div>
              {isSelected && (
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center">
                  <Check className="w-5 h-5" />
                </div>
              )}
              {isPending && (
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
