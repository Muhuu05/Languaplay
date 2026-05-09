import { Link } from "wouter";
import { motion } from "framer-motion";
import { Sparkles, Globe, Trophy } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const features = [
  {
    icon: Globe,
    title: "Олон хэлний курс",
    desc: "Англи, Испани, Франц, Япон зэрэг 7 хэлийг сонго.",
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/30",
  },
  {
    icon: Sparkles,
    title: "Хөгжилтэй сургалт",
    desc: "Богино, тоглоом мэт хичээлээр өдөр бүр сурах.",
    color: "text-orange-500",
    bg: "bg-orange-100 dark:bg-orange-500/15",
    border: "border-orange-300 dark:border-orange-500/40",
  },
  {
    icon: Trophy,
    title: "Лиг ба амжилт",
    desc: "Дэвших, амжилт нээх, найзуудтайгаа өрсөлдөх.",
    color: "text-yellow-500",
    bg: "bg-yellow-100 dark:bg-yellow-500/15",
    border: "border-yellow-300 dark:border-yellow-500/40",
  },
];

export default function Landing() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col">
      <header className="flex items-center justify-between px-4 md:px-8 py-4 border-b-2 border-border">
        <div className="flex items-center gap-2">
          <img src={`${basePath}/logo.svg`} alt="LinguaPlay" className="w-9 h-9" />
          <span className="text-2xl font-black text-primary tracking-tight">
            LinguaPlay
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/sign-in">
            <button className="hidden sm:inline-flex h-10 items-center px-4 rounded-xl border-2 border-border bg-background hover:bg-muted text-foreground font-bold button-press">
              Нэвтрэх
            </button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center px-4 md:px-8 py-10 md:py-16 max-w-5xl w-full mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl"
        >
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4">
            Шинэ хэл сурах
            <br />
            <span className="text-primary">хамгийн хөгжилтэй</span> арга
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8">
            LinguaPlay-р өдөр бүр 5 минут зарцуулж шинэ хэлээр итгэлтэй ярьж сур.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/sign-up">
              <button className="w-full sm:w-auto h-14 px-8 rounded-2xl bg-primary text-primary-foreground font-black text-lg uppercase tracking-wide border-b-4 border-primary-border hover:bg-primary/90 button-press">
                Үнэгүй эхлэх
              </button>
            </Link>
            <Link href="/sign-in">
              <button className="w-full sm:w-auto h-14 px-8 rounded-2xl bg-background text-foreground font-black text-lg uppercase tracking-wide border-2 border-border hover:bg-muted button-press">
                Аль хэдийн бүртгэлтэй
              </button>
            </Link>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12 md:mt-16 w-full">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 + i * 0.1 }}
                className={`rounded-2xl border-2 ${f.border} ${f.bg} p-5`}
              >
                <div
                  className={`w-12 h-12 rounded-xl ${f.bg} ${f.color} flex items-center justify-center mb-3 border-2 ${f.border}`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black mb-1 text-foreground">
                  {f.title}
                </h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </main>

      <footer className="border-t-2 border-border py-4 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} LinguaPlay
      </footer>
    </div>
  );
}
