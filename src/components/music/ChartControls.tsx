"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { LayoutList, LayoutGrid, ArrowUpDown, ArrowDown, ArrowUp } from "lucide-react";
import type { ChartFilter, SortBy, SortOrder } from "@/types";

interface ChartControlsProps {
  currentFilter: ChartFilter;
  showViewToggle?: boolean;
}

export function ChartControls({ currentFilter, showViewToggle = false }: ChartControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    if (key !== "page") params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  }

  const sortBy = currentFilter.sortBy ?? "recently";
  const sortOrder = currentFilter.sortOrder ?? "desc";

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          update("q", (fd.get("q") as string) ?? "");
        }}
        className="flex gap-2 flex-1 min-w-48"
      >
        <input
          name="q"
          defaultValue={currentFilter.q ?? ""}
          placeholder="Search…"
          className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button type="submit" className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors">
          Search
        </button>
      </form>

      {/* Sort by */}
      <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 text-sm">
        <button
          onClick={() => update("sortBy", "recently")}
          className={`px-3 py-1 rounded-md transition-colors ${sortBy === "recently" ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}
        >
          Recent
        </button>
        <button
          onClick={() => update("sortBy", "score")}
          className={`px-3 py-1 rounded-md transition-colors ${sortBy === "score" ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}
        >
          Top Rated
        </button>
      </div>

      {/* Sort order */}
      <button
        onClick={() => update("sortOrder", sortOrder === "desc" ? "asc" : "desc")}
        className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        title={sortOrder === "desc" ? "Descending" : "Ascending"}
      >
        {sortOrder === "desc" ? <ArrowDown className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />}
      </button>

      {/* View toggle */}
      {showViewToggle && (
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
          <button
            onClick={() => update("view", "list")}
            className={`p-1.5 rounded transition-colors ${!searchParams.get("view") || searchParams.get("view") === "list" ? "bg-indigo-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}
          >
            <LayoutList className="w-4 h-4" />
          </button>
          <button
            onClick={() => update("view", "grid")}
            className={`p-1.5 rounded transition-colors ${searchParams.get("view") === "grid" ? "bg-indigo-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
