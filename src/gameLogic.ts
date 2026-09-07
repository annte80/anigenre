import type { AnigenreEntity, CategoryKey } from "@/types";
import { CATEGORIES } from "@/types";

export interface GuessResult {
  entity: AnigenreEntity;
  matches: Record<CategoryKey, boolean>;
}

export function compareGuess(
  guess: AnigenreEntity,
  answer: AnigenreEntity,
): GuessResult {
  const matches = {} as Record<CategoryKey, boolean>;
  for (const cat of CATEGORIES) {
    matches[cat.key] = guess[cat.key].toLowerCase() === answer[cat.key].toLowerCase();
  }
  return { entity: guess, matches };
}

export function getTodayIndexUTC(launchDate: string, totalEntities: number): number {
  if (totalEntities <= 0) return 0;
  const launch = new Date(launchDate + "T00:00:00Z");
  const now = new Date();
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysSince = Math.floor((now.getTime() - launch.getTime()) / msPerDay);
  return ((daysSince % totalEntities) + totalEntities) % totalEntities;
}

export function getTodayAnswer(
  entities: AnigenreEntity[],
  launchDate: string,
): AnigenreEntity | null {
  if (entities.length === 0) return null;
  const sorted = [...entities].sort((a, b) => a.shuffle_rank - b.shuffle_rank);
  const index = getTodayIndexUTC(launchDate, sorted.length);
  return sorted[index] ?? null;
}

export function getPuzzleNumber(launchDate: string): number {
  const launch = new Date(launchDate + "T00:00:00Z");
  const now = new Date();
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((now.getTime() - launch.getTime()) / msPerDay) + 1;
}

export function getTodayKey(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function searchEntities(
  query: string,
  entities: AnigenreEntity[],
  limit = 8,
): AnigenreEntity[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const results: { entity: AnigenreEntity; score: number }[] = [];
  for (const entity of entities) {
    const nameLower = entity.name.toLowerCase();
    let score = -1;
    if (nameLower === q) score = 100;
    else if (nameLower.startsWith(q)) score = 90;
    else if (nameLower.includes(q)) score = 70;
    else if (entity.aliases) {
      const aliases = entity.aliases
        .split(",")
        .map((a) => a.trim().toLowerCase())
        .filter(Boolean);
      for (const alias of aliases) {
        if (alias === q) score = Math.max(score, 80);
        else if (alias.startsWith(q)) score = Math.max(score, 60);
        else if (alias.includes(q)) score = Math.max(score, 40);
      }
    }
    if (score >= 0) results.push({ entity, score });
  }
  results.sort((a, b) => b.score - a.score || a.entity.name.localeCompare(b.entity.name));
  return results.slice(0, limit).map((r) => r.entity);
}

export function buildShareText(
  puzzleNumber: number,
  guesses: GuessResult[],
  solved: boolean,
): string {
  const tiles = guesses
    .map((g) =>
      CATEGORIES.map((c) => (g.matches[c.key] ? "🟩" : "⬜")).join(""),
    )
    .join("\n");
  const solvedIn = solved ? `${guesses.length}/10` : "X/10";
  return `Anigenre #${puzzleNumber}\n${solvedIn}\n${tiles}`;
}
