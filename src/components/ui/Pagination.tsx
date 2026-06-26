"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "./Button";
import type { PageSize } from "@/types";

interface PaginationProps {
  total: number;
  page: number;
  pageSize: PageSize;
}

const PAGE_SIZES: PageSize[] = [10, 30, 50, 100];

export function Pagination({ total, page, pageSize }: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const totalPages = Math.ceil(total / pageSize);

  function navigate(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      params.set(k, v);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  function goToPage(p: number) {
    navigate({ page: String(p) });
  }

  function setPageSize(size: PageSize) {
    navigate({ pageSize: String(size), page: "1" });
  }

  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span>Per page:</span>
        {PAGE_SIZES.map((size) => (
          <button
            key={size}
            onClick={() => setPageSize(size)}
            className={`px-2 py-1 rounded transition-colors ${
              size === pageSize
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
          >
            {size}
          </button>
        ))}
        <span className="ml-2 text-gray-500">{total} total</span>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => goToPage(page - 1)}
          disabled={page <= 1}
        >
          ‹
        </Button>
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} className="px-2 text-gray-400">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => goToPage(p as number)}
              className={`w-8 h-8 rounded text-sm transition-colors ${
                p === page
                  ? "bg-indigo-600 text-white"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              {p}
            </button>
          )
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => goToPage(page + 1)}
          disabled={page >= totalPages}
        >
          ›
        </Button>
      </div>
    </div>
  );
}
