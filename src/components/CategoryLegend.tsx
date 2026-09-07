import { useState } from "react";
import { HelpCircle, X } from "lucide-react";
import { CATEGORIES } from "@/types";

export function CategoryLegend() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-teal-500 text-slate-900 shadow-lg shadow-teal-500/30 transition hover:bg-teal-400 hover:scale-105 active:scale-95"
        aria-label="Category legend"
      >
        <HelpCircle className="h-6 w-6" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Category Legend</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-white transition"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              {CATEGORIES.map((cat) => (
                <div key={cat.key} className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-teal-500/15 text-xs font-bold text-teal-400">
                    {cat.label[0]}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {cat.label}
                    </div>
                    <div className="text-xs text-slate-400 leading-relaxed">
                      {cat.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-lg bg-slate-800 p-3 text-xs text-slate-400">
              <span className="text-teal-400">🟩 Green</span> = exact match.{" "}
              <span className="text-slate-300">⬜ Gray</span> = no match. A gray
              Type tile means your guess is a different kind of thing than
              today's answer — a useful clue!
            </div>
          </div>
        </div>
      )}
    </>
  );
}
