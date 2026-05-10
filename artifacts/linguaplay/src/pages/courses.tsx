import { useListCourses, getListCoursesQueryKey, useSetActiveCourse, useGetMe } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Loader2, Users, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Courses() {
  const [, setLocation] = useLocation();
  const { data: courses, isLoading: coursesLoading } = useListCourses({
    query: { queryKey: getListCoursesQueryKey(), refetchInterval: 30_000 },
  });
  const { data: user, isLoading: userLoading } = useGetMe();
  const setActiveCourse = useSetActiveCourse();

  const handleSelectCourse = (courseId: string) => {
    setActiveCourse.mutate(
      { data: { courseId } },
      {
        onSuccess: () => {
          setLocation("/");
        }
      }
    );
  };

  if (coursesLoading || userLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-3xl font-black text-center mb-2">Хэлний курсууд</h1>
      <p className="text-center text-muted-foreground font-medium mb-10">
        Дараа сурах хэлээ сонгоорой
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {courses?.map((course) => {
          const isActive = user?.activeCourseId === course.id;
          const isPending = setActiveCourse.isPending && setActiveCourse.variables?.data.courseId === course.id;

          return (
            <button
              key={course.id}
              onClick={() => !isActive && handleSelectCourse(course.id)}
              disabled={isActive || setActiveCourse.isPending}
              className={cn(
                "card-press p-6 rounded-2xl border-2 text-left relative overflow-hidden transition-all flex items-center justify-between",
                isActive
                  ? "border-primary bg-primary/5 cursor-default"
                  : "border-border bg-card hover:border-primary/50 cursor-pointer border-b-4"
              )}
            >
              <div className="flex items-center gap-4">
                <div className="text-5xl">{course.flagEmoji}</div>
                <div>
                  <h3 className="font-bold text-xl">{course.languageName}</h3>
                  <div className="flex items-center text-sm text-muted-foreground font-medium mt-1 gap-1">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                    </span>
                    <Users className="w-4 h-4 ml-1" />
                    {course.learnerCount.toLocaleString()} сурагч
                  </div>
                </div>
              </div>

              {isActive && (
                <div className="bg-primary text-primary-foreground rounded-full p-1 absolute top-4 right-4 shadow-sm">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              )}

              {isPending && (
                <div className="absolute top-4 right-4">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
