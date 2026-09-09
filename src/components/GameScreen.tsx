import { useState, useRef, useEffect, useMemo } from "react";
import type { AnigenreEntity, CategoryKey } from "@/types";
import { CATEGORIES, MAX_GUESSES, toValueArray } from "@/types";
import {
  compareGuess,
  searchEntities,
  getTodayAnswer,
  getPuzzleNumber,
  getTodayKey,
  buildShareText,
  type GuessResult,
} from "@/gameLogic";
import { Check, X, Search, Copy, CheckCheck, Trophy, Frown, ArrowUp, ArrowDown } from "lucide-react";
import { useTheme } from "@/lib/theme";

interface GameState {
  guesses: GuessResult[];
  status: "playing" | "won" | "lost";
  date: string;
}

function loadGameState(date: string): GameState {
  try {
    const raw = localStorage.getItem(`anigenre:${date}`);
    if (raw) {
      const parsed = JSON.parse(raw) as GameState;
      if (parsed.date === date) return parsed;
    }
  } catch {
    // ignore
  }
  return { guesses: [], status: "playing", date };
}

function saveGameState(state: GameState) {
  try {
    localStorage.setItem(`anigenre:${state.date}`, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function GameScreen({ entities, launchDate }: { entities: AnigenreEntity[]; launchDate: string }) {
  const answer = useMemo(() => getTodayAnswer(entities, launchDate), [entities, launchDate]);
  const puzzleNumber = useMemo(() => getPuzzleNumber(launchDate), [launchDate]);
  const todayKey = useMemo(() => getTodayKey(), []);
  const { theme } = useTheme();

  const [gameState, setGameState] = useState<GameState>(() => loadGameState(todayKey));
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(
    () => searchEntities(input, entities),
    [input, entities],
  );

  const guessedIds = useMemo(
    () => new Set(gameState.guesses.map((g) => g.entity.id)),
    [gameState.guesses],
  );

  const remaining = MAX_GUESSES - gameState.guesses.length;

  useEffect(() => {
    saveGameState(gameState);
  }, [gameState]);

  // Check for day rollover
  useEffect(() => {
    const currentKey = getTodayKey();
    if (currentKey !== todayKey) {
      setGameState(loadGameState(currentKey));
    }
  }, [todayKey]);

  const submitGuess = (entity: AnigenreEntity) => {
    if (gameState.status !== "playing" || !answer) return;
    if (guessedIds.has(entity.id)) {
      setError("Already guessed!");
      setTimeout(() => setError(""), 2000);
      return;
    }
    const result = compareGuess(entity, answer);
    const isWin = entity.id === answer.id;
    const newGuesses = [...gameState.guesses, result];
    const newStatus = isWin ? "won" : newGuesses.length >= MAX_GUESSES ? "lost" : "playing";
    setGameState({ guesses: newGuesses, status: newStatus, date: todayKey });
    setInput("");
    setShowSuggestions(false);
    setHighlightIdx(-1);
    setError("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (gameState.status !== "playing") return;
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === "Enter" && suggestions.length === 1) {
        e.preventDefault();
        submitGuess(suggestions[0]);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIdx((p) => Math.min(p + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIdx((p) => Math.max(p - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const idx = highlightIdx >= 0 ? highlightIdx : 0;
      if (suggestions[idx]) submitGuess(suggestions[idx]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setHighlightIdx(-1);
    }
  };

  const handleCopy = () => {
    const text = buildShareText(puzzleNumber, gameState.guesses, gameState.status === "won");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!answer) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-slate-400">
          The entity pool is empty. Add entries via the admin page to start
          playing.
        </p>
      </div>
    );
  }

  const isGameOver = gameState.status !== "playing";

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 pb-24">
      {/* Guesses remaining */}
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-slate-400">
          Puzzle <span className={`font-semibold ${theme.accentTextClass}`}>#{puzzleNumber}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {Array.from({ length: MAX_GUESSES }).map((_, i) => (
              <div
                key={i}
                className={`h-2 w-2 rounded-full transition ${
                  i < gameState.guesses.length
                    ? gameState.guesses[i].entity.id === answer.id
                      ? theme.swatchClass
                      : "bg-slate-600"
                    : "bg-slate-700"
                }`}
              />
            ))}
          </div>
          <span className={`text-sm font-semibold ${remaining <= 3 ? "text-amber-400" : "text-slate-300"}`}>
            {remaining} left
          </span>
        </div>
      </div>

      {/* Guess input */}
      {!isGameOver && (
        <div className="relative mb-4" ref={containerRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setShowSuggestions(true);
                setHighlightIdx(-1);
                setError("");
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="Type a name to search..."
              className={`w-full rounded-xl border border-slate-700 bg-slate-900 py-3 pl-10 pr-4 text-white placeholder-slate-500 outline-none transition ${theme.ringClass}`}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>
          {error && (
            <div className="mt-1 text-xs text-amber-400">{error}</div>
          )}
          {showSuggestions && input && (
            <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
                            {suggestions.length === 0 ? (
                <div className="px-4 py-3 text-sm text-slate-500">
                  {input.trim().length < 2 ? "Keep typing..." : "No matches found"}
                </div>
              ) : (
                suggestions.map((entity, i) => (
                  <button
                    key={entity.id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      submitGuess(entity);
                    }}
                    onMouseEnter={() => setHighlightIdx(i)}
                    className={`flex w-full items-center px-4 py-2.5 text-left transition ${
                      i === highlightIdx
                        ? theme.softBgClass
                        : "hover:bg-slate-800"
                    } ${guessedIds.has(entity.id) ? "opacity-40" : ""}`}
                  >
                    <span className="text-sm font-medium text-white">
                      {entity.name}
                    </span>
                  </button>
                ))
              )}

      {/* Guess history */}
      <div className="space-y-2">
        {[...gameState.guesses].reverse().map((guess, revIdx) => {
          const idx = gameState.guesses.length - 1 - revIdx;
          const isWinning = guess.entity.id === answer.id;
          return (
            <GuessRow
              key={`${guess.entity.id}-${idx}`}
              guess={guess}
              isWinning={isWinning}
            />
          );
        })}
      </div>

      {/* Win/Loss overlay */}
      {isGameOver && (
        <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-900 p-6 text-center">
          <div className="mb-3 flex justify-center">
            {gameState.status === "won" ? (
              <div className={`flex h-14 w-14 items-center justify-center rounded-full ${theme.iconBgClass}`}>
                <Trophy className={`h-7 w-7 ${theme.accentTextClass}`} />
              </div>
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-700">
                <Frown className="h-7 w-7 text-slate-400" />
              </div>
            )}
          </div>
          <h2 className="text-xl font-bold text-white mb-1">
            {gameState.status === "won" ? "Solved!" : "Better luck next time!"}
          </h2>
          <p className="text-sm text-slate-400 mb-1">
            Today's answer was
          </p>
          <p className={`text-lg font-semibold mb-4 ${theme.accentTextClass}`}>
            {answer.name}
          </p>
          <p className="text-xs text-slate-500 mb-4">
            {toValueArray(answer.anime).join(', ')} · {toValueArray(answer.type).join(', ')} · {toValueArray(answer.format).join(', ')} · {toValueArray(answer.studio).join(', ')}{answer.year != null ? ` · ${answer.year}` : ''}
          </p>
          <button
            onClick={handleCopy}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition active:scale-95 ${theme.solidClass} ${theme.solidTextClass}`}
          >
            {copied ? (
              <>
                <CheckCheck className="h-4 w-4" /> Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" /> Copy Result
              </>
            )}
          </button>
          <p className="mt-3 text-xs text-slate-500">
            Come back tomorrow for a new puzzle.
          </p>
        </div>
      )}
    </div>
  );
}

function GuessRow({ guess, isWinning }: { guess: GuessResult; isWinning: boolean }) {
  const { theme } = useTheme();

  return (
    <div
      className={`rounded-xl border p-3 transition ${
        isWinning
          ? `${theme.borderClass} ${theme.softBgClass}`
          : "border-slate-800 bg-slate-900/50"
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-white">
          {guess.entity.name}
        </span>
                <span className="text-xs text-slate-500">{toValueArray(guess.entity.anime).join(', ')}</span>
      </div>
      <div className="grid grid-cols-6 gap-1.5">
        {CATEGORIES.map((cat) => {
          const state = guess.matches[cat.key];
          const isYear = cat.kind === "numeric";
          const tileClass =
            state === "exact"
              ? `${theme.solidClass} ${theme.solidTextClass}`
              : state === "close"
                ? "bg-yellow-500 text-yellow-950"
                : "bg-slate-800 text-slate-500";
          return (
            <div
              key={cat.key}
              className={`flex flex-col items-center justify-center rounded-lg py-1.5 transition ${tileClass}`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wide opacity-70">
                {cat.label.slice(0, 3)}
              </span>
              <div className="mt-0.5 flex items-center gap-0.5">
                {state === "exact" ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <X className="h-3 w-3" />
                )}
                {isYear && state !== "exact" && guess.yearDirection === "up" && (
                  <ArrowUp className="h-3 w-3" />
                )}
                {isYear && state !== "exact" && guess.yearDirection === "down" && (
                  <ArrowDown className="h-3 w-3" />
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
        {CATEGORIES.map((cat) => (
          <span key={cat.key} className="text-[10px] text-slate-600">
            <span className="font-medium text-slate-500">{cat.label}:</span>{" "}
            {cat.kind === "numeric"
              ? (guess.entity.year ?? "Unknown")
              : toValueArray(guess.entity[cat.key] as string[] | string).join(', ')}
          </span>
        ))}
      </div>
    </div>
  );
}
