export interface AnigenreEntity {
  id: string;
  name: string;
  aliases: string;
  genre: string[];
  type: string[];
  anime: string[];
  format: string[];
  studio: string[];
  demographic: string[];
  year: number | null;
  shuffle_rank: number;
  created_at: string;
}

// Safely reads a category value whether the underlying data is still the
// old single-string shape or the new multi-value array shape. Lets us
// deploy this code before the database migration runs, with zero risk of
// a mismatched window between the two.
export function toValueArray(v: string[] | string | null | undefined): string[] {
  if (Array.isArray(v)) return v;
  if (typeof v === "string" && v.length > 0) return [v];
  return [];
}

export interface AnigenreConfig {
  id: boolean;
  launch_date: string;
}

export type CategoryKey =
  | "year"
  | "type"
  | "anime"
  | "format"
  | "studio"
  | "demographic";

export const YEAR_CLOSE_THRESHOLD = 3;

export const CATEGORIES: { key: CategoryKey; label: string; description: string; kind: "text" | "numeric" }[] = [
  {
    key: "year",
    label: "Year",
    description: "The year this entity first appeared. Green = exact year, yellow = within 3 years, with an arrow showing if the real answer is earlier or later.",
    kind: "numeric",
  },
  {
    key: "type",
    label: "Type",
    description:
      "What kind of thing this entity is: Character, Technique, Location, Organization, Item, Arc, etc.",
    kind: "text",
  },
  {
    key: "anime",
    label: "Anime",
    description: "Which anime series this entity is from.",
    kind: "text",
  },
  {
    key: "format",
    label: "Format",
    description: "TV series, Movie, OVA, etc.",
    kind: "text",
  },
  {
    key: "studio",
    label: "Studio",
    description: "The animation studio that produced the anime.",
    kind: "text",
  },
  {
    key: "demographic",
    label: "Demographic",
    description:
      "The target audience category, e.g. Shonen, Shojo, Seinen, Josei.",
    kind: "text",
  },
];

export const MAX_GUESSES = 8;
