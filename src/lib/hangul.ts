import { disassemble } from "es-hangul";

export function koreanIncludes(target: string, query: string): boolean {
  if (!query.trim()) return true;
  return disassemble(target.toLowerCase()).includes(disassemble(query.toLowerCase()));
}

// If the query ends with a Korean character, return the query without that character.
// This lets API calls use the "stem" to catch results that partial composition would miss.
export function koreanStem(query: string): string | null {
  if (!query || query.length < 2) return null;
  const last = query[query.length - 1];
  if (/[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(last)) return query.slice(0, -1);
  return null;
}
