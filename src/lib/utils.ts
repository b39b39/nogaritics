import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a partial date (year required; month/day optional) */
export function formatPublishedDate(
  year?: number | null,
  month?: number | null,
  day?: number | null
): string {
  if (!year) return "Unknown";
  if (!month) return String(year);
  if (!day) return `${year}.${String(month).padStart(2, "0")}`;
  return `${year}.${String(month).padStart(2, "0")}.${String(day).padStart(2, "0")}`;
}

/** Convert ISO 3166-1 alpha-2 country code to flag emoji */
export function countryCodeToFlag(code: string): string {
  const upper = code.toUpperCase();
  return [...upper]
    .map((c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    .join("");
}

/** Format score to display string */
export function formatScore(score: number | null | undefined): string {
  if (score == null) return "—";
  return score.toFixed(2);
}

/** Truncate text with ellipsis */
export function truncate(text: string, maxLength: number): string {
  return text.length > maxLength ? text.slice(0, maxLength) + "…" : text;
}

/** Build published date sort key for comparison */
export function publishedSortKey(
  year?: number | null,
  month?: number | null,
  day?: number | null
): number {
  const y = year ?? 0;
  const m = month ?? 0;
  const d = day ?? 0;
  return y * 10000 + m * 100 + d;
}
