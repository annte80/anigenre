import { Sparkles } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <a href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500">
            <Sparkles className="h-5 w-5 text-slate-900" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            Anigenre
          </span>
        </a>
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="text-sm font-medium text-slate-300 hover:text-teal-400 transition"
          >
            Home
          </a>
          <span className="rounded-full border border-slate-700 bg-slate-800/50 px-3 py-1 text-xs font-medium text-slate-500 cursor-not-allowed select-none">
            Game Maker — Coming Soon
          </span>
        </div>
      </div>
    </header>
  );
}
