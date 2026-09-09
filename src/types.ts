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
  | "genre"
  | "type"
  | "anime"
  | "format"
  | "studio"
  | "demographic";

export const CATEGORIES: { key: CategoryKey; label: string; description: string }[] = [
  {
    key: "genre",
    label: "Genre",
    description: "The anime's genre(s), e.g. Action, Romance, Comedy.",
  },
  {
    key: "type",
    label: "Type",
    description:
      "What kind of thing this entity is: Character, Technique, Location, Organization, Item, Arc, etc.",
  },
  {
    key: "anime",
    label: "Anime",
    description: "Which anime series this entity is from.",
  },
  {
    key: "format",
    label: "Format",
    description: "TV series, Movie, OVA, etc.",
  },
  {
    key: "studio",
    label: "Studio",
    description: "The animation studio that produced the anime.",
  },
  {
    key: "demographic",
    label: "Demographic",
    description:
      "The target audience category, e.g. Shonen, Shojo, Seinen, Josei.",
  },
];

export const MAX_GUESSES = 10;
