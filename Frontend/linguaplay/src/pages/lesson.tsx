import { useState, useEffect, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import {
  useGetLesson,
  useCheckAnswer,
  useCompleteLesson,
  useGetMe,
  getGetMeQueryKey,
  getGetCourseQueryKey,
  getGetMyStreakQueryKey,
  getGetDailyGoalQueryKey,
  getGetLessonQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  X,
  Heart,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { getWordEmoji, getWordPalette } from "@/lib/word-emoji";

/* ── vocabulary card derived from a single exercise ── */
interface VocabCard {
  english: string;
  mongolian: string;
  emoji: string;
}

function buildVocabCards(
  exercises: Array<{
    kind: string;
    prompt: string | null;
    correctAnswer?: string | null;
    choices?: Array<{ id: string; text: string }> | null;
  }>,
): VocabCard[] {
  const seen = new Set<string>();
  const cards: VocabCard[] = [];

  for (const ex of exercises) {
    const answer = ex.correctAnswer?.trim();
    if (!answer || seen.has(answer.toLowerCase())) continue;
    seen.add(answer.toLowerCase());

    // Clean up the Mongolian prompt into a plain phrase
    let mongolian = (ex.prompt ?? "").replace(/[—–-]\s*Англиар.*/, "").trim();
    // Remove trailing question marks and filler phrases
    mongolian = mongolian
      .replace(/\s*гэдгийг Англиар.*/, "")
      .replace(/\s*гэдэг нь.*/, "")
      .replace(/\s*— .*/, "")
      .replace(/\?$/, "")
      .trim();

    cards.push({
      english: answer,
      mongolian,
      emoji: getWordEmoji(answer),
    });
  }
  return cards;
}

/* ─────────────────────────────── component ─────────────────────────────── */
export default function Lesson() {
  const { lessonId } = useParams();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: user } = useGetMe();
  const { data: lesson, isLoading } = useGetLesson(lessonId || "", {
    query: {
      enabled: !!lessonId,
      queryKey: getGetLessonQueryKey(lessonId || ""),
    },
  });

  const checkAnswer = useCheckAnswer();
  const completeLesson = useCompleteLesson();

  // ── phase: 'learn' → show vocab cards; 'practice' → exercises ──
  const [phase, setPhase] = useState<"learn" | "practice">("learn");
  const [learnIndex, setLearnIndex] = useState(0);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [localHearts, setLocalHearts] = useState<number | null>(null);
  const [startTime] = useState(Date.now());

  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [feedback, setFeedback] = useState<{
    correct: boolean;
    correctAnswer: string;
  } | null>(null);

  useEffect(() => {
    if (user && localHearts === null) setLocalHearts(user.hearts);
  }, [user, localHearts]);

  const vocabCards = useMemo(
    () => (lesson ? buildVocabCards(lesson.exercises) : []),
    [lesson],
  );

  // If no vocab cards (edge case), skip straight to practice
  useEffect(() => {
    if (phase === "learn" && vocabCards.length === 0) {
      setPhase("practice");
    }
  }, [phase, vocabCards.length]);

  if (isLoading || !lesson || localHearts === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // ── progress bar: learn phase fills first half, practice fills second ──
  const totalSteps = vocabCards.length + lesson.exercises.length;
  const doneSteps =
    phase === "learn" ? learnIndex : vocabCards.length + currentIndex;
  const progress = totalSteps > 0 ? (doneSteps / totalSteps) * 100 : 0;

  // ─────────────── LEARN PHASE ───────────────
  if (phase === "learn") {
    const card = vocabCards[learnIndex];

    if (!card) {
      return null;
    }

    const palette = getWordPalette(card.english);
    const isLast = learnIndex === vocabCards.length - 1;

    const handleLearnNext = () => {
      if (isLast) {
        setPhase("practice");
      } else {
        setLearnIndex((i) => i + 1);
      }
    };

    return (
      <div className="min-h-screen flex flex-col bg-background">
        {/* Header */}
        <div className="h-16 flex items-center px-4 max-w-4xl mx-auto w-full gap-4">
          <button
            onClick={() => setLocation("/")}
            className="p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-400 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-sm font-bold text-muted-foreground">
            {learnIndex + 1}/{vocabCards.length}
          </div>
        </div>

        {/* Vocab card */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-lg mx-auto w-full">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-6">
            Үгийг судлах
          </p>

          <AnimatePresence mode="wait">
            <motion.div
              key={learnIndex}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -30, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full"
            >
              {/* Card face */}
              <div
                className={cn(
                  "rounded-3xl border-2 border-b-4 overflow-hidden shadow-lg mb-6",
                  "border-border",
                )}
              >
                {/* Emoji banner */}
                <div
                  className={cn(
                    "flex items-center justify-center py-10 text-8xl",
                    "bg-gradient-to-br",
                    palette.bg,
                    palette.dark,
                  )}
                >
                  {card.emoji}
                </div>

                {/* Text area */}
                <div className="bg-card px-6 py-6 text-center">
                  <p className="text-3xl font-black mb-2">{card.english}</p>
                  <p className="text-muted-foreground font-medium text-lg">
                    {card.mongolian}
                  </p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <button
            onClick={handleLearnNext}
            className="button-press w-full py-4 rounded-2xl bg-blue-500 text-white font-black text-lg border-b-4 border-blue-700 flex items-center justify-center gap-2"
          >
            {isLast ? "Дасгал хийх" : "Цааш"}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // ─────────────── PRACTICE PHASE ───────────────
  const exercise = lesson.exercises[currentIndex];
  const isFinished = currentIndex >= lesson.exercises.length;

  const handleCheck = () => {
    if (!selectedAnswer || feedback) return;
    checkAnswer.mutate(
      { exerciseId: exercise.id, data: { answer: selectedAnswer } },
      {
        onSuccess: (res) => {
          setFeedback({
            correct: res.correct,
            correctAnswer: res.correctAnswer,
          });
          if (res.correct) {
            setCorrectCount((prev) => prev + 1);
          } else {
            setWrongCount((prev) => prev + 1);
            setLocalHearts((prev) => Math.max(0, prev! - 1));
          }
        },
      },
    );
  };

  const handleContinue = () => {
    if (localHearts === 0) return;
    setFeedback(null);
    setSelectedAnswer("");

    if (currentIndex === lesson.exercises.length - 1) {
      const timeSeconds = Math.floor((Date.now() - startTime) / 1000);
      completeLesson.mutate(
        {
          lessonId: lesson.id,
          data: {
            correctCount,
            totalCount: lesson.exercises.length,
            timeSeconds,
          },
        },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
            queryClient.invalidateQueries({
              queryKey: getGetCourseQueryKey(lesson.courseId),
            });
            queryClient.invalidateQueries({
              queryKey: getGetMyStreakQueryKey(),
            });
            queryClient.invalidateQueries({
              queryKey: getGetDailyGoalQueryKey(),
            });
            setLocation(`/lesson/${lesson.id}/complete`);
          },
        },
      );
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  if (localHearts === 0 && !feedback?.correct) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <Heart className="w-24 h-24 text-red-500 fill-red-500 mb-6" />
        <h1 className="text-3xl font-black mb-4">Зүрх дуусчээ!</h1>
        <p className="text-muted-foreground mb-8">
          Үргэлжлүүлэн суралцахын тулд дэлгүүрээс зүрхээ нөхөөрэй.
        </p>
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
        <button
          onClick={() => setLocation("/")}
          className="p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors"
        >
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
            <h2 className="text-2xl md:text-3xl font-black mb-8">
              {exercise.prompt}
            </h2>

            {exercise.kind === "multiple_choice" && exercise.choices && (
              <div
                className={cn(
                  "grid gap-3 md:gap-4",
                  exercise.choices.length === 2
                    ? "grid-cols-2"
                    : exercise.choices.length === 4
                      ? "grid-cols-2"
                      : "grid-cols-2 sm:grid-cols-3",
                )}
              >
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
                          : "border-border hover:border-muted-foreground/30 hover:shadow-md",
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
                              : "border-border/70 bg-card/90 text-muted-foreground",
                          )}
                        >
                          {letter}
                        </div>
                      </div>
                      <div className="flex min-h-[3.5rem] items-center justify-center px-3 py-3 text-center">
                        <span
                          className={cn(
                            "font-bold text-base md:text-lg leading-tight",
                            isSelected ? "text-primary" : "text-foreground",
                          )}
                        >
                          {choice.text}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {exercise.kind === "translate" && (
              <textarea
                value={selectedAnswer}
                onChange={(e) => setSelectedAnswer(e.target.value)}
                disabled={!!feedback}
                placeholder="Орчуулгаа бичнэ үү"
                className="w-full p-4 rounded-2xl border-2 border-border bg-muted/50 focus:border-primary focus:bg-card outline-none resize-none h-32 font-medium text-lg"
              />
            )}

            {exercise.kind === "word_bank" && exercise.wordBank && (
              <div className="space-y-4">
                <div className="min-h-[80px] p-4 rounded-2xl border-2 border-border bg-muted/50 flex flex-wrap gap-2 items-center">
                  {selectedAnswer ? (
                    selectedAnswer.split(" ").map((word, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          const words = selectedAnswer
                            .split(" ")
                            .filter((w) => w);
                          words.splice(index, 1);
                          setSelectedAnswer(words.join(" "));
                        }}
                        disabled={!!feedback}
                        className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold border-b-4 border-primary-border hover:bg-primary/90 transition-all"
                      >
                        {word}
                      </button>
                    ))
                  ) : (
                    <span className="text-muted-foreground italic">
                      Үгсийг сонгоно уу...
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {exercise.wordBank.map((word, index) => {
                    const isUsed =
                      selectedAnswer &&
                      selectedAnswer.split(" ").includes(word);
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          if (isUsed) return;
                          setSelectedAnswer((prev) =>
                            prev ? `${prev} ${word}` : word,
                          );
                        }}
                        disabled={!!feedback || !!isUsed}
                        className={cn(
                          "px-4 py-2 rounded-xl font-bold border-b-4 transition-all",
                          isUsed
                            ? "bg-muted text-muted-foreground border-muted cursor-not-allowed opacity-50"
                            : "bg-card border-border hover:border-primary/50 hover:shadow-md",
                        )}
                      >
                        {word}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {exercise.kind !== "multiple_choice" &&
              exercise.kind !== "translate" &&
              exercise.kind !== "word_bank" && (
                <div className="p-8 border-2 border-dashed border-orange-300 bg-orange-50 rounded-2xl text-center">
                  <p className="font-bold text-orange-600">
                    '{exercise.kind}' төрлийн дасгалын дэлгэц энэ хувилбарт
                    бэлэн болж байна.
                  </p>
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
      <div
        className={cn(
          "border-t-2 border-border p-4 md:p-8 transition-colors",
          feedback?.correct
            ? "bg-green-100 border-green-200"
            : feedback?.correct === false
              ? "bg-red-100 border-red-200"
              : "bg-background",
        )}
      >
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex-1 w-full">
            {feedback ? (
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "p-2 rounded-full",
                    feedback.correct
                      ? "bg-white text-green-500"
                      : "bg-white text-red-500",
                  )}
                >
                  {feedback.correct ? (
                    <CheckCircle2 className="w-8 h-8" />
                  ) : (
                    <XCircle className="w-8 h-8" />
                  )}
                </div>
                <div>
                  <h3
                    className={cn(
                      "font-black text-xl md:text-2xl mb-1",
                      feedback.correct ? "text-green-600" : "text-red-600",
                    )}
                  >
                    {feedback.correct ? "Гайхалтай!" : "Зөв хариулт:"}
                  </h3>
                  {!feedback.correct && (
                    <p className="text-red-700 font-medium text-lg">
                      {feedback.correctAnswer}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="hidden md:block" />
            )}
          </div>

          <button
            onClick={feedback ? handleContinue : handleCheck}
            disabled={(!selectedAnswer && !feedback) || checkAnswer.isPending}
            className={cn(
              "button-press w-full md:w-auto min-w-[150px] py-4 px-8 rounded-2xl font-black text-lg border-b-4 uppercase transition-all",
              !selectedAnswer && !feedback
                ? "bg-muted text-muted-foreground border-muted-border cursor-not-allowed"
                : feedback?.correct
                  ? "bg-green-500 text-white border-green-700"
                  : feedback?.correct === false
                    ? "bg-red-500 text-white border-red-700"
                    : "bg-primary text-white border-primary-border",
            )}
          >
            {checkAnswer.isPending ? (
              <Loader2 className="w-6 h-6 animate-spin mx-auto" />
            ) : feedback ? (
              "Үргэлжлүүлэх"
            ) : (
              "Шалгах"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
