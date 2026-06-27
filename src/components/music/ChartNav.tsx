"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, X } from "lucide-react";
import { TagSelectModal } from "@/components/post/TagSelectModal";
import { NationSelectModal } from "@/components/post/NationSelectModal";
import type { TargetType, SortBy, SortOrder } from "@/types";
import type { SelectedTag } from "@/components/post/TagPicker";

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function useOutsideClick(ref: React.RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, onClose]);
}

function ModeToggle({ value, onChange }: { value: "or" | "and"; onChange: (v: "or" | "and") => void }) {
  return (
    <div className="flex rounded border border-gray-200 overflow-hidden flex-shrink-0">
      {(["or", "and"] as const).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          className={`px-2 py-0.5 text-[10px] font-bold uppercase transition-colors ${value === m ? "bg-indigo-600 text-white" : "text-gray-400 hover:bg-gray-50"}`}
        >
          {m}
        </button>
      ))}
    </div>
  );
}

interface ArtistResult { id: string; name: string; image: string | null; nation: string | null; isGroup: boolean }
interface UserResult { id: string; name: string | null; image: string | null }

export interface ChartNavInitial {
  q: string;
  targetType: TargetType;
  artistId: string;
  artistName: string;
  includeSolo: boolean;
  includeGroup: boolean;
  publishedFrom: string;
  publishedTo: string;
  tagIds: string[];
  tagLabels: Record<string, string>;
  tagMode: "or" | "and";
  nations: string[];
  userId: string;
  userName: string;
  showRated: boolean;
  showStarred: boolean;
  userMode: "or" | "and";
  sortBy: SortBy;
  sortOrder: SortOrder;
  pageSize: string;
}

const LABEL_CLS = "flex-shrink-0 w-[76px] text-[11px] font-semibold uppercase tracking-wider text-gray-400";
const ROW_CLS = "flex items-center gap-2 py-2.5 border-b border-gray-100 last:border-0 flex-wrap";
const INPUT_CLS = "px-2.5 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white";
const PILL_BTN = (active: boolean) =>
  `px-3 py-1 rounded-lg text-xs font-medium transition-colors ${active ? "bg-indigo-600 text-white" : "border border-gray-200 text-gray-600 hover:border-indigo-300"}`;
const CHIP_CLS = "inline-flex items-center gap-1 rounded-full bg-indigo-50 text-indigo-700 px-2 py-0.5 text-xs flex-shrink-0";
const ADD_BTN_CLS = "flex-shrink-0 px-2.5 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors";

export function ChartNav({ initial, nations: availableNationCodes }: { initial: ChartNavInitial; nations: string[] }) {
  const router = useRouter();

  const [q, setQ] = useState(initial.q);
  const [targetType, setTargetType] = useState<TargetType>(initial.targetType);

  const [artistId, setArtistId] = useState(initial.artistId);
  const [artistName, setArtistName] = useState(initial.artistName);
  const [artistQuery, setArtistQuery] = useState(initial.artistName);
  const [artistResults, setArtistResults] = useState<ArtistResult[]>([]);
  const [artistDropOpen, setArtistDropOpen] = useState(false);
  const [includeSolo, setIncludeSolo] = useState(initial.includeSolo);
  const [includeGroup, setIncludeGroup] = useState(initial.includeGroup);
  const artistRef = useRef<HTMLDivElement>(null);
  useOutsideClick(artistRef, () => setArtistDropOpen(false));

  const [publishedFrom, setPublishedFrom] = useState(initial.publishedFrom);
  const [publishedTo, setPublishedTo] = useState(initial.publishedTo);

  const [tagIds, setTagIds] = useState<string[]>(initial.tagIds);
  const [tagLabels, setTagLabels] = useState<Record<string, string>>(initial.tagLabels);
  const [tagMode, setTagMode] = useState<"or" | "and">(initial.tagMode);
  const [tagModalOpen, setTagModalOpen] = useState(false);

  const [selectedNations, setSelectedNations] = useState<string[]>(initial.nations);
  const [nationModalOpen, setNationModalOpen] = useState(false);

  const [userId, setUserId] = useState(initial.userId);
  const [userName, setUserName] = useState(initial.userName);
  const [userQuery, setUserQuery] = useState(initial.userName);
  const [userResults, setUserResults] = useState<UserResult[]>([]);
  const [userDropOpen, setUserDropOpen] = useState(false);
  const [showRated, setShowRated] = useState(initial.showRated);
  const [showStarred, setShowStarred] = useState(initial.showStarred);
  const [userMode, setUserMode] = useState<"or" | "and">(initial.userMode);
  const userRef = useRef<HTMLDivElement>(null);
  useOutsideClick(userRef, () => setUserDropOpen(false));

  // Artist search
  const debouncedArtistQ = useDebounce(artistQuery, 280);
  useEffect(() => {
    if (!debouncedArtistQ || debouncedArtistQ === artistName) { setArtistResults([]); return; }
    fetch(`/api/artists?q=${encodeURIComponent(debouncedArtistQ)}&pageSize=8`)
      .then((r) => r.json()).then((d) => setArtistResults(d.items ?? [])).catch(() => {});
  }, [debouncedArtistQ, artistName]);

  // User search
  const debouncedUserQ = useDebounce(userQuery, 280);
  useEffect(() => {
    if (!debouncedUserQ || debouncedUserQ === userName) { setUserResults([]); return; }
    fetch(`/api/users/search?q=${encodeURIComponent(debouncedUserQ)}`)
      .then((r) => r.json()).then((d) => setUserResults(d.items ?? [])).catch(() => {});
  }, [debouncedUserQ, userName]);

  // Country items (code → Korean name)
  const countryItems = useMemo(() => {
    try {
      const regionNames = new Intl.DisplayNames(["ko"], { type: "region" });
      return availableNationCodes
        .map((code) => ({ code, name: regionNames.of(code.toUpperCase()) ?? code }))
        .sort((a, b) => a.name.localeCompare(b.name, "ko"));
    } catch {
      return availableNationCodes.map((code) => ({ code, name: code }));
    }
  }, [availableNationCodes]);

  const codeToName = useMemo(
    () => Object.fromEntries(countryItems.map((c) => [c.code, c.name])),
    [countryItems],
  );

  // Tag modal value
  const tagValue: SelectedTag[] = tagIds.map((id) => ({ id, name: tagLabels[id] ?? id }));

  // ─── URL builder ──────────────────────────────────────────────────
  function buildUrl(overrides: {
    q?: string; targetType?: TargetType;
    artistId?: string; includeSolo?: boolean; includeGroup?: boolean;
    publishedFrom?: string; publishedTo?: string;
    tagIds?: string[]; tagMode?: "or" | "and";
    nations?: string[];
    userId?: string; showRated?: boolean; showStarred?: boolean; userMode?: "or" | "and";
  }) {
    const merged = {
      q, targetType, artistId, includeSolo, includeGroup,
      publishedFrom, publishedTo,
      tagIds, tagMode,
      nations: selectedNations,
      userId, showRated, showStarred, userMode,
      ...overrides,
    };
    const p = new URLSearchParams();
    if (merged.q) p.set("q", merged.q);
    if (merged.targetType !== "both") p.set("targetType", merged.targetType);
    if (merged.artistId) {
      p.set("artistId", merged.artistId);
      if (merged.includeSolo) p.set("includeSolo", "1");
      if (merged.includeGroup) p.set("includeGroup", "1");
    }
    if (merged.publishedFrom) p.set("publishedFrom", merged.publishedFrom);
    if (merged.publishedTo) p.set("publishedTo", merged.publishedTo);
    if (merged.tagIds.length > 0) {
      p.set("tagIds", merged.tagIds.join(","));
      if (merged.tagMode === "or") p.set("tagMode", "or");
    }
    if (merged.nations.length > 0) p.set("nations", merged.nations.join(","));
    if (merged.userId) {
      if (merged.showRated && merged.showStarred) {
        p.set("ratedBy", merged.userId);
        p.set("starredBy", merged.userId);
        if (merged.userMode === "and") p.set("userMode", "and");
      } else if (merged.showRated) {
        p.set("ratedBy", merged.userId);
      } else if (merged.showStarred) {
        p.set("starredBy", merged.userId);
      }
    }
    if (initial.sortBy !== "recently") p.set("sortBy", initial.sortBy);
    if (initial.sortOrder !== "desc") p.set("sortOrder", initial.sortOrder);
    if (initial.pageSize !== "30") p.set("pageSize", initial.pageSize);
    p.set("page", "1");
    return `/chart?${p.toString()}`;
  }

  function push(overrides: Parameters<typeof buildUrl>[0]) {
    router.push(buildUrl(overrides));
  }

  function clearArtist() {
    setArtistId(""); setArtistName(""); setArtistQuery("");
    setIncludeSolo(false); setIncludeGroup(false);
    push({ artistId: "", includeSolo: false, includeGroup: false });
  }

  function clearUser() {
    setUserId(""); setUserName(""); setUserQuery("");
    setShowRated(false); setShowStarred(false);
    push({ userId: "", showRated: false, showStarred: false });
  }

  const hasFilters = !!q || targetType !== "both" || !!artistId || !!publishedFrom || !!publishedTo
    || tagIds.length > 0 || selectedNations.length > 0 || !!userId;

  // ─── Render ───────────────────────────────────────────────────────
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-1">

      {/* Search */}
      <div className={ROW_CLS}>
        <span className={LABEL_CLS}>Search</span>
        <form onSubmit={(e) => { e.preventDefault(); push({ q }); }} className="flex flex-1 gap-2 min-w-0">
          <div className="flex-1 relative min-w-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="name..."
              className={`${INPUT_CLS} w-full pl-8`}
            />
          </div>
          <button type="submit" className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors flex-shrink-0">
            Go
          </button>
        </form>
        <button
          type="button"
          onClick={() => {
            setQ(""); setTargetType("both");
            setArtistId(""); setArtistName(""); setArtistQuery(""); setIncludeSolo(false); setIncludeGroup(false);
            setPublishedFrom(""); setPublishedTo("");
            setTagIds([]); setTagLabels({}); setTagMode("and");
            setSelectedNations([]);
            setUserId(""); setUserName(""); setUserQuery(""); setShowRated(false); setShowStarred(false); setUserMode("or");
            router.push("/chart");
          }}
          className="flex-shrink-0 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-500 hover:border-red-300 hover:text-red-500 transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Type */}
      <div className={ROW_CLS}>
        <span className={LABEL_CLS}>Type</span>
        {(["both", "track", "album"] as TargetType[]).map((t) => (
          <button key={t} onClick={() => { setTargetType(t); push({ targetType: t }); }} className={PILL_BTN(targetType === t)}>
            {t === "both" ? "All" : t.charAt(0).toUpperCase() + t.slice(1) + "s"}
          </button>
        ))}
      </div>

      {/* Artist */}
      <div className={ROW_CLS}>
        <span className={LABEL_CLS}>Artist</span>
        <div className="relative w-48 flex-shrink-0" ref={artistRef}>
          <input
            value={artistQuery}
            onChange={(e) => { setArtistQuery(e.target.value); setArtistDropOpen(true); }}
            onFocus={() => { if (!artistId) setArtistDropOpen(true); }}
            onKeyDown={(e) => { if (e.key === "Enter") { setArtistDropOpen(false); push({}); } }}
            placeholder="artist name..."
            className={`${INPUT_CLS} w-full pr-7`}
          />
          {artistId && (
            <button onClick={clearArtist} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          {artistDropOpen && artistResults.length > 0 && (
            <div className="absolute z-50 left-0 top-full mt-1 w-64 bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden">
              {artistResults.map((a) => (
                <button
                  key={a.id}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-indigo-50 text-left"
                  onClick={() => {
                    setArtistId(a.id); setArtistName(a.name); setArtistQuery(a.name);
                    setArtistDropOpen(false); setArtistResults([]);
                    push({ artistId: a.id });
                  }}
                >
                  {a.image && <Image src={a.image} alt="" width={20} height={20} className="w-5 h-5 rounded-full object-cover flex-shrink-0" />}
                  <span className="flex-1 text-xs truncate">{a.name}</span>
                  {a.nation && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/flags/${a.nation}.svg`} alt={a.nation} width={20} height={14} className="w-5 h-[14px] object-cover rounded-[2px] flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        <label className="flex items-center gap-1.5 cursor-pointer text-xs text-gray-600 flex-shrink-0">
          <input
            type="checkbox"
            checked={includeSolo}
            onChange={(e) => { setIncludeSolo(e.target.checked); push({ includeSolo: e.target.checked }); }}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-400"
          />
          solo/unit
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer text-xs text-gray-600 flex-shrink-0">
          <input
            type="checkbox"
            checked={includeGroup}
            onChange={(e) => { setIncludeGroup(e.target.checked); push({ includeGroup: e.target.checked }); }}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-400"
          />
          group
        </label>
      </div>

      {/* Published */}
      <div className={ROW_CLS}>
        <span className={LABEL_CLS}>Published</span>
        <input
          value={publishedFrom}
          onChange={(e) => setPublishedFrom(e.target.value)}
          onBlur={() => push({ publishedFrom })}
          onKeyDown={(e) => { if (e.key === "Enter") push({ publishedFrom }); }}
          placeholder="from"
          className={`${INPUT_CLS} w-28 flex-shrink-0`}
        />
        <span className="text-gray-400 text-sm flex-shrink-0">~</span>
        <input
          value={publishedTo}
          onChange={(e) => setPublishedTo(e.target.value)}
          onBlur={() => push({ publishedTo })}
          onKeyDown={(e) => { if (e.key === "Enter") push({ publishedTo }); }}
          placeholder="to"
          className={`${INPUT_CLS} w-28 flex-shrink-0`}
        />
        <span className="text-[10px] text-gray-300 flex-shrink-0">e.g. 2025 · 2025-06 · 2025-06-15</span>
      </div>

      {/* Tags */}
      <div className={ROW_CLS}>
        <span className={LABEL_CLS}>Tags</span>
        <button onClick={() => setTagModalOpen(true)} className={ADD_BTN_CLS}>+ Tags</button>
        <ModeToggle
          value={tagMode}
          onChange={(m) => { setTagMode(m); push({ tagMode: m }); }}
        />
        {tagIds.map((id) => (
          <span key={id} className={CHIP_CLS}>
            {tagLabels[id] ?? id}
            <button
              onClick={() => {
                const next = tagIds.filter((t) => t !== id);
                const nextLabels = { ...tagLabels };
                delete nextLabels[id];
                setTagIds(next); setTagLabels(nextLabels);
                push({ tagIds: next });
              }}
              className="hover:text-indigo-900"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        ))}
      </div>

      {/* Nation */}
      <div className={ROW_CLS}>
        <span className={LABEL_CLS}>Nation</span>
        <button onClick={() => setNationModalOpen(true)} className={ADD_BTN_CLS}>+ Nations</button>
        {selectedNations.map((code) => (
          <span key={code} className={CHIP_CLS}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/flags/${code}.svg`} alt={code} width={16} height={11} className="w-4 h-[11px] object-cover rounded-[2px] flex-shrink-0" />
            {codeToName[code] ?? code}
            <button
              onClick={() => {
                const next = selectedNations.filter((c) => c !== code);
                setSelectedNations(next);
                push({ nations: next });
              }}
              className="hover:text-indigo-900"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        ))}
      </div>

      {/* User */}
      <div className={ROW_CLS}>
        <span className={LABEL_CLS}>User</span>
        <div className="relative w-48 flex-shrink-0" ref={userRef}>
          <input
            value={userQuery}
            onChange={(e) => { setUserQuery(e.target.value); setUserDropOpen(true); }}
            onFocus={() => { if (!userId) setUserDropOpen(true); }}
            onKeyDown={(e) => { if (e.key === "Enter") { setUserDropOpen(false); push({}); } }}
            placeholder="user name..."
            className={`${INPUT_CLS} w-full pr-7`}
          />
          {userId && (
            <button onClick={clearUser} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          {userDropOpen && userResults.length > 0 && (
            <div className="absolute z-50 left-0 top-full mt-1 w-56 bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden">
              {userResults.map((u) => (
                <button
                  key={u.id}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-indigo-50 text-left"
                  onClick={() => {
                    const name = u.name ?? u.id;
                    setUserId(u.id); setUserName(name); setUserQuery(name);
                    setUserDropOpen(false); setUserResults([]);
                    setShowRated(true);
                    push({ userId: u.id, showRated: true, showStarred });
                  }}
                >
                  {u.image && <Image src={u.image} alt="" width={20} height={20} className="w-5 h-5 rounded-full object-cover flex-shrink-0" />}
                  <span className="text-xs truncate">{u.name ?? u.id}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <label className="flex items-center gap-1.5 cursor-pointer text-xs text-gray-600 flex-shrink-0">
          <input
            type="checkbox"
            checked={showRated}
            onChange={(e) => {
              const next = e.target.checked;
              setShowRated(next);
              push({ showRated: next });
            }}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-400"
          />
          Rated
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer text-xs text-gray-600 flex-shrink-0">
          <input
            type="checkbox"
            checked={showStarred}
            onChange={(e) => {
              const next = e.target.checked;
              setShowStarred(next);
              push({ showStarred: next });
            }}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-400"
          />
          Starred
        </label>
        {showRated && showStarred && (
          <ModeToggle
            value={userMode}
            onChange={(m) => { setUserMode(m); push({ userMode: m }); }}
          />
        )}
      </div>

      {/* Modals */}
      <TagSelectModal
        open={tagModalOpen}
        onClose={() => setTagModalOpen(false)}
        hideCreate
        value={tagValue}
        onChange={(tags) => {
          const ids = tags.map((t) => t.id);
          const labels = Object.fromEntries(tags.map((t) => [t.id, t.name]));
          setTagIds(ids); setTagLabels(labels);
          push({ tagIds: ids });
        }}
      />

      <NationSelectModal
        open={nationModalOpen}
        onClose={() => setNationModalOpen(false)}
        multi
        value={selectedNations}
        onChange={(codes) => {
          setSelectedNations(codes);
          push({ nations: codes });
        }}
        countries={countryItems}
      />
    </div>
  );
}
