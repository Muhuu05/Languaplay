import { Moon, Sun } from "lucide-react";
import { useTheme } from "./theme-provider";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  compact?: boolean;
}

export function ThemeToggle({ className, compact }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Гэрэлт горим" : "Харанхуй горим"}
      title={isDark ? "Гэрэлт горим" : "Харанхуй горим"}
      className={cn(
        "inline-flex items-center justify-center rounded-xl border-2 border-border bg-background hover:bg-muted text-foreground transition-colors button-press",
        compact ? "h-9 w-9" : "h-10 w-10",
        className,
      )}
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}
