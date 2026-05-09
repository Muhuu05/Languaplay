import { useGetMe, useGetCourse } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Loader2, Star, CheckCircle, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Learn() {
  const { data: user, isLoading: userLoading } = useGetMe();
  const { data: courseDetail, isLoading: courseLoading } = useGetCourse(
    user?.activeCourseId || "",
    {
      query: {
        enabled: !!user?.activeCourseId,
        queryKey: ["course", user?.activeCourseId],
        refetchInterval: 30_000,
      }
    }
  );

  if (userLoading || (user?.activeCourseId && courseLoading)) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user?.activeCourseId || !courseDetail) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-4">Сурахад бэлэн үү?</h2>
        <p className="text-muted-foreground mb-8">Аяллаа эхлүүлэх курсээ сонгоорой.</p>
        <Link href="/courses">
          <div className="button-press inline-flex items-center justify-center px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-lg border-b-4 border-primary-border cursor-pointer">
            Курс үзэх
          </div>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black">{courseDetail.course.languageName}</h1>
          <p className="flex items-center gap-1.5 text-muted-foreground font-medium mt-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            {courseDetail.course.learnerCount.toLocaleString()} сурагч
          </p>
        </div>
      </div>

      <div className="space-y-12">
        {courseDetail.units.map((unit) => (
          <div key={unit.id} className="relative">
            <div 
              className="p-6 rounded-3xl mb-8 text-white shadow-sm border-b-4"
              style={{ backgroundColor: unit.color, borderColor: 'rgba(0,0,0,0.1)' }}
            >
              <h2 className="text-2xl font-bold">Бүлэг {unit.order}: {unit.title}</h2>
              <p className="opacity-90 font-medium">{unit.description}</p>
            </div>

            <div className="flex flex-col items-center space-y-4 py-4">
              {unit.lessons.map((lesson, idx) => {
                // Create a winding path effect
                const isEven = idx % 2 === 0;
                const offset = isEven ? -40 : 40;
                const isStart = idx === 0;
                const isEnd = idx === unit.lessons.length - 1;
                
                return (
                  <div 
                    key={lesson.id} 
                    className="relative w-full flex justify-center py-4"
                  >
                    {!isEnd && (
                      <div className="absolute top-1/2 left-1/2 w-1 h-24 bg-border -z-10 transform -translate-x-1/2" />
                    )}
                    
                    <div 
                      style={{ transform: `translateX(${offset}px)` }}
                      className="relative z-10"
                    >
                      {lesson.locked ? (
                        <div className="w-16 h-16 rounded-full bg-muted border-4 border-border flex items-center justify-center shadow-sm">
                          <Lock className="w-6 h-6 text-muted-foreground" />
                        </div>
                      ) : lesson.completedCount >= lesson.exerciseCount && lesson.exerciseCount > 0 ? (
                        <Link href={`/lesson/${lesson.id}`}>
                          <div className="button-press w-20 h-20 rounded-full bg-yellow-400 border-b-4 border-yellow-600 flex items-center justify-center cursor-pointer shadow-sm ring-4 ring-yellow-400/30">
                            <CheckCircle className="w-10 h-10 text-white fill-yellow-500" />
                          </div>
                        </Link>
                      ) : (
                        <Link href={`/lesson/${lesson.id}`}>
                          <div 
                            className="button-press w-20 h-20 rounded-full flex flex-col items-center justify-center cursor-pointer border-b-4 text-white shadow-sm relative ring-4 ring-primary/30"
                            style={{ backgroundColor: unit.color, borderColor: 'rgba(0,0,0,0.15)' }}
                          >
                            <Star className="w-8 h-8 fill-current" />
                            {lesson.crowns > 0 && (
                              <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full border-2 border-white shadow-sm">
                                {lesson.crowns}
                              </div>
                            )}
                          </div>
                        </Link>
                      )}
                      
                      <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-center">
                        <span className="text-sm font-bold text-foreground/80">{lesson.title}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
