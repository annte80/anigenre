import { Sparkles } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { ThemePicker } from "@/components/ThemePicker";

export function Header() {
  const { theme } = useTheme();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <a href="/" className="flex items-center gap-2">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${theme.solidClass}`}>
            <Sparkles className={`h-5 w-5 ${theme.solidTextClass}`} />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            Anigenre
          </span>
        </a>
        <div className="flex items-center gap-3">
          
            href="/"
            className={`text-sm font-medium text-slate-300 transition ${theme.hoverTextClass}`}
          >
            Home
          </a>
          <span className="rounded-full border border-slate-700 bg-slate-800/50 px-3 py-1 text-xs font-medium text-slate-500 cursor-not-allowed select-none">
            Game Maker — Coming Soon
          </span>
        </div>
      </div>
      <ThemePicker />
    </header>
  );
}
