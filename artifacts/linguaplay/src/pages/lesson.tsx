import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useGetLesson, useCheckAnswer, useCompleteLesson, useGetMe, getGetMeQueryKey, getGetCourseQueryKey, getGetMyStreakQueryKey, getGetDailyGoalQueryKey, getGetLessonQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { X, Heart, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { getWordEmoji, getWordPalette } from "@/lib/word-emoji";

export default function Lesson() {
  const { lessonId } = useParams();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const { data: user } = useGetMe();
  const { data: lesson, isLoading } = useGetLesson(lessonId || "", {
    query: { enabled: !!lessonId, queryKey: getGetLessonQueryKey(lessonId || "") }
  });
  
  const checkAnswer = useCheckAnswer();
  const completeLesson = useCompleteLesson();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [localHearts, setLocalHearts] = useState<number | null>(null);
  const [startTime] = useState(Date.now());
  
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [feedback, setFeedback] = useState<{correct: boolean, correctAnswer: string} | null>(null);

  useEffect(() => {
    if (user && localHearts === null) {
      setLocalHearts(user.hearts);
    }
  }, [user, localHearts]);

  if (isLoading || !lesson || localHearts === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const exercise = lesson.exercises[currentIndex];
  const progress = (currentIndex / lesson.exercises.length) * 100;
  const isFinished = currentIndex >= lesson.exercises.length;

  const handleCheck = () => {
    if (!selectedAnswer || feedback) return;

    checkAnswer.mutate(
      { exerciseId: exercise.id, data: { answer: selectedAnswer } },
      {
        onSuccess: (res) => {
          setFeedback({ correct: res.correct, correctAnswer: res.correctAnswer });
          if (res.correct) {
            setCorrectCount(prev => prev + 1);
          } else {
            setWrongCount(prev => prev + 1);
            setLocalHearts(prev => Math.max(0, prev! - 1));
          }
        }
      }
    );
  };

  const handleContinue = () => {
    if (localHearts === 0) {
      // Out of hearts state handled below
      return;
    }

    setFeedback(null);
    setSelectedAnswer("");
    
    if (currentIndex === lesson.exercises.length - 1) {
      // Finish lesson
      const timeSeconds = Math.floor((Date.now() - startTime) / 1000);
      completeLesson.mutate(
        { 
          lessonId: lesson.id, 
          data: { correctCount, totalCount: lesson.exercises.length, timeSeconds } 
        },
        {
          onSuccess: (result) => {
            // Update cache
            queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetCourseQueryKey(lesson.courseId) });
            queryClient.invalidateQueries({ queryKey: getGetMyStreakQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetDailyGoalQueryKey() });
            
            // Navigate to complete page and pass state via window history or just navigate and let it refetch
            setLocation(`/lesson/${lesson.id}/complete`);
          }
        }
      );
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  if (localHearts === 0 && !feedback?.correct) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <Heart className="w-24 h-24 text-red-500 fill-red-500 mb-6" />
        <h1 className="text-3xl font-black mb-4">Зүрх дуусчээ!</h1>
        <p className="text-muted-foreground mb-8">Үргэлжлүүлэн суралцахын тулд дэлгүүрээс зүрхээ нөхөөрэй.</p>
        <div className="space-y-4 w-full max-w-sm">
          <button 
            onClick={() => setLocation("/shop")}
            className="button-press w-full py-4 rounded-2xl bg-primary text-white font-bold text-lg border-b-4 border-primary-border"
          >
            Дэлгүүр рүү очих
          </button>
          <button 
            onClick={() => setLocation("/")}
            className="button-press w-full py-4 rounded-2xl bg-muted text-muted-foreground font-bold text-lg border-b-4 border-muted-border"
          >
            Хичээлээс гарах
          </button>
        </div>
      </div>
    );
  }

  if (isFinished || completeLesson.isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Header */}
      <div className="h-16 flex items-center px-4 max-w-4xl mx-auto w-full gap-4">
        <button onClick={() => setLocation("/")} className="p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors">
          <X className="w-6 h-6" />
        </button>
        <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-green-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center text-red-500 font-bold">
          <Heart className="w-6 h-6 mr-1 fill-red-500" />
          {localHearts}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 max-w-3xl mx-auto w-full p-4 md:p-8 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            className="w-full"
          >
            <h2 className="text-2xl md:text-3xl font-black mb-8">{exercise.prompt}</h2>
            
            {exercise.kind === 'multiple_choice' && exercise.choices && (
              <div className={cn(
                "grid gap-3 md:gap-4",
                exercise.choices.length === 2 ? "grid-cols-2" :
                exercise.choices.length === 4 ? "grid-cols-2" :
                "grid-cols-2 sm:grid-cols-3"
              )}>
                {exercise.choices.map((choice, i) => {
                  const emoji = getWordEmoji(choice.text);
                  const palette = getWordPalette(choice.text);
                  const isSelected = selectedAnswer === choice.id;
                  const letter = String.fromCharCode(65 + i);
                  return (
                    <button
                      key={choice.id}
                      onClick={() => !feedback && setSelectedAnswer(choice.id)}
                      disabled={!!feedback}
                      className={cn(
                        "card-press group relative flex flex-col items-stretch overflow-hidden rounded-2xl border-2 border-b-4 bg-card text-left transition-all",
                        isSelected
                          ? "border-primary ring-2 ring-primary/40 shadow-lg -translate-y-0.5"
                          : "border-border hover:border-muted-foreground/30 hover:shadow-md"
                      )}
                    >
                      <div
                        className={cn(
                          "relative flex aspect-[5/4] items-center justify-center bg-gradient-to-br",
                          palette.bg,
                          palette.dark,
                        )}
                      >
                        {choice.imageUrl ? (
                          <img
                            src={choice.imageUrl}
                            alt={choice.text}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="select-none text-5xl md:text-6xl drop-shadow-sm transition-transform group-hover:scale-110">
                            {emoji}
                          </span>
                        )}
                        <div
                          className={cn(
                            "absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg border-2 text-xs font-black transition-colors",
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border/70 bg-card/90 text-muted-foreground"
                          )}
                        >
                          {letter}
                        </div>
                      </div>
                      <div className="flex min-h-[3.5rem] items-center justify-center px-3 py-3 text-center">
                        <span className={cn(
                          "font-bold text-base md:text-lg leading-tight",
                          isSelected ? "text-primary" : "text-foreground"
                        )}>
                          {choice.text}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {exercise.kind === 'translate' && (
              <textarea
                value={selectedAnswer}
                onChange={(e) => setSelectedAnswer(e.target.value)}
                disabled={!!feedback}
                placeholder="Орчуулгаа бичнэ үү"
                className="w-full p-4 rounded-2xl border-2 border-border bg-muted/50 focus:border-primary focus:bg-card outline-none resize-none h-32 font-medium text-lg"
              />
            )}
            
            {/* Fallback for unhandled types */}
            {exercise.kind !== 'multiple_choice' && exercise.kind !== 'translate' && (
              <div className="p-8 border-2 border-dashed border-orange-300 bg-orange-50 rounded-2xl text-center">
                <p className="font-bold text-orange-600">'{exercise.kind}' төрлийн дасгалын дэлгэц энэ хувилбарт хараахан бэлэн биш байна.</p>
                <button 
                  className="mt-4 px-4 py-2 bg-orange-200 text-orange-800 rounded-xl font-bold"
                  onClick={() => setSelectedAnswer("skip")}
                >
                  Одоохондоо алгасах
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer / Feedback Drawer */}
      <div className={cn(
        "border-t-2 border-border p-4 md:p-8 transition-colors",
        feedback?.correct ? "bg-green-100 border-green-200" : 
        feedback?.correct === false ? "bg-red-100 border-red-200" : "bg-background"
      )}>
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-4 items-center justify-between">
          
          {/* Feedback Content */}
          <div className="flex-1 w-full">
            {feedback ? (
              <div className="flex items-start gap-4">
                <div className={cn(
                  "p-2 rounded-full",
                  feedback.correct ? "bg-white text-green-500" : "bg-white text-red-500"
                )}>
                  {feedback.correct ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
                </div>
                <div>
                  <h3 className={cn(
                    "font-black text-xl md:text-2xl mb-1",
                    feedback.correct ? "text-green-600" : "text-red-600"
                  )}>
                    {feedback.correct ? "Гайхалтай!" : "Зөв хариулт:"}
                  </h3>
                  {!feedback.correct && (
                    <p className="text-red-700 font-medium text-lg">{feedback.correctAnswer}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="hidden md:block" />
            )}
          </div>

          {/* Action Button */}
          <button
            onClick={feedback ? handleContinue : handleCheck}
            disabled={!selectedAnswer && !feedback || checkAnswer.isPending}
            className={cn(
              "button-press w-full md:w-auto min-w-[150px] py-4 px-8 rounded-2xl font-black text-lg border-b-4 uppercase transition-all",
              !selectedAnswer && !feedback
                ? "bg-muted text-muted-foreground border-muted-border cursor-not-allowed"
                : feedback?.correct
                ? "bg-green-500 text-white border-green-700"
                : feedback?.correct === false
                ? "bg-red-500 text-white border-red-700"
                : "bg-primary text-white border-primary-border"
            )}
          >
            {checkAnswer.isPending ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 
             feedback ? "Үргэлжлүүлэх" : "Шалгах"}
          </button>
        </div>
      </div>
    </div>
  );
}
