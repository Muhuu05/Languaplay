import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useGetMe, useGetDailyGoal } from "@workspace/api-client-react";
import { useClerk, useUser } from "@clerk/react";
import {
  Flame,
  Heart,
  Gem,
  Target,
  Home,
  Trophy,
  Award,
  Store,
  User,
  Loader2,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const navItems = [
  { icon: Home, label: "Сурах", href: "/" },
  { icon: Trophy, label: "Жагсаалт", href: "/leaderboard" },
  { icon: Award, label: "Амжилт", href: "/achievements" },
  { icon: Store, label: "Дэлгүүр", href: "/shop" },
  { icon: User, label: "Профайл", href: "/profile" },
];

function SignOutButton({ compact }: { compact?: boolean }) {
  const { signOut } = useClerk();
  return (
    <button
      type="button"
      onClick={() => signOut({ redirectUrl: `${basePath}/welcome` })}
      aria-label="Гарах"
      title="Гарах"
      className={cn(
        "inline-flex items-center justify-center rounded-xl border-2 border-border bg-background hover:bg-muted text-foreground transition-colors button-press",
        compact ? "h-9 w-9" : "h-10 w-10",
      )}
    >
      <LogOut className="w-5 h-5" />
    </button>
  );
}

export function TopBar() {
  const { data: user, isLoading: isUserLoading } = useGetMe();
  const { data: dailyGoal } = useGetDailyGoal();

  if (isUserLoading) {
    return (
      <div className="h-14 flex items-center justify-center border-b-2 border-border bg-background sticky top-0 z-50">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="h-14 flex items-center justify-between px-4 border-b-2 border-border bg-background sticky top-0 z-50">
      <Link
        href="/courses"
        className="flex items-center hover:opacity-80 transition-opacity"
      >
        <div className="text-2xl mr-2">
          {user.activeCourse?.flagEmoji || "🌍"}
        </div>
      </Link>

      <div className="flex items-center space-x-3 md:space-x-4 font-bold">
        <Link
          href="/profile"
          className="flex items-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border-2 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 hover:opacity-80 transition-opacity text-sm"
        >
          <span className="mr-1 text-xs uppercase opacity-70">Lv</span>
          <span className="font-black">{Math.floor(user.xp / 100) + 1}</span>
        </Link>

        <div className="flex items-center text-orange-500">
          <Flame className="w-5 h-5 mr-1 fill-orange-500" />
          <span>{user.streakDays}</span>
        </div>

        <div className="flex items-center text-purple-500">
          <Gem className="w-5 h-5 mr-1 fill-purple-500" />
          <span>{user.gems}</span>
        </div>

        <div className="flex items-center text-red-500">
          <Heart className="w-5 h-5 mr-1 fill-red-500" />
          <span>{user.hearts}</span>
        </div>

        {dailyGoal && (
          <Link
            href="/goal"
            className="hidden sm:flex items-center text-blue-500 hover:opacity-80 transition-opacity"
          >
            <Target className="w-5 h-5 mr-1" />
            <span className="text-sm">
              {dailyGoal.earnedTodayXp}/{dailyGoal.goalXp}
            </span>
          </Link>
        )}

        <div className="md:hidden">
          <ThemeToggle compact />
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  const [location] = useLocation();
  const { user } = useUser();
  const { data: meUser } = useGetMe();
  const displayName =
    meUser?.displayName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.username ||
    user?.primaryEmailAddress?.emailAddress ||
    "Сурагч";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="hidden md:flex flex-col w-64 border-r-2 border-border h-screen fixed left-0 top-0 bg-background p-4">
      <div className="flex items-center gap-2 mb-8 pl-2">
        <img src={`${basePath}/logo.svg`} alt="LinguaPlay" className="w-8 h-8" />
        <div className="text-2xl font-black text-primary tracking-tight">
          LinguaPlay
        </div>
      </div>
      <nav className="space-y-2 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center space-x-3 px-4 py-3 rounded-xl font-bold transition-all cursor-pointer border-2",
                  isActive
                    ? "bg-primary/10 text-primary border-primary bg-primary/10 border-b-4 translate-y-0"
                    : "text-muted-foreground border-transparent hover:bg-muted hover:border-muted hover:border-b-4",
                )}
              >
                <Icon className={cn("w-6 h-6", isActive && "fill-primary/20")} />
                <span className="text-lg">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 pt-4 border-t-2 border-border space-y-3">
        <div className="flex items-center gap-3 px-2">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-lg shrink-0"
            style={{ backgroundColor: meUser?.avatarColor || "#58cc02" }}
          >
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-foreground truncate text-sm">
              {displayName}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              @{meUser?.username || "сурагч"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}

export function BottomNav() {
  const [location] = useLocation();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 border-t-2 border-border bg-background flex justify-around p-2 pb-safe z-50">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location === item.href;
        return (
          <Link key={item.href} href={item.href}>
            <div
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded-xl transition-colors cursor-pointer",
                isActive
                  ? "text-primary bg-primary/10 border-2 border-primary border-b-4"
                  : "text-muted-foreground hover:bg-muted border-2 border-transparent",
              )}
            >
              <Icon className={cn("w-6 h-6", isActive && "fill-primary/20")} />
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-background text-foreground font-sans">
      <Sidebar />
      <div className="flex-1 md:ml-64 flex flex-col min-h-[100dvh]">
        <TopBar />
        <main className="flex-1 pb-20 md:pb-0 overflow-y-auto">
          <div className="max-w-3xl mx-auto w-full p-4 md:p-8">{children}</div>
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
