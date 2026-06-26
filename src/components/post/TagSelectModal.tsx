"use client";

import { useState, useEffect } from "react";
import { SearchIcon, XIcon, PlusIcon } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { koreanIncludes } from "@/lib/hangul";
import type { SelectedTag } from "@/components/post/TagPicker";

interface Props {
  open: boolean;
  onClose: () => void;
  value: SelectedTag[];
  onChange: (tags: SelectedTag[]) => void;
  hideCreate?: boolean;
}

interface TagItem {
  id: string;
  name: string;
}

export function TagSelectModal({ open, onClose, value, onChange, hideCreate = false }: Props) {
  const [allTags, setAllTags] = useState<TagItem[]>([]);
  const [query, setQuery] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!open) { setQuery(""); setNewTagName(""); return; }
    fetch("/api/tags?q=").then((r) => r.json()).then((data) => setAllTags(data.items ?? []));
  }, [open]);

  const filtered = query.trim()
    ? allTags.filter((t) => koreanIncludes(t.name, query))
    : allTags;

  const selectedIds = new Set(value.map((t) => t.id));

  function toggle(tag: TagItem) {
    if (selectedIds.has(tag.id)) {
      onChange(value.filter((t) => t.id !== tag.id));
    } else {
      onChange([...value, { id: tag.id, name: tag.name }]);
    }
  }

  async function createTag() {
    const name = newTagName.trim();
    if (!name) return;
    setCreating(true);
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const tag = await res.json();
      if (res.ok) {
        setAllTags((prev) => [...prev, { id: tag.id, name: tag.name }].sort((a, b) => a.name.localeCompare(b.name)));
        onChange([...value, { id: tag.id, name: tag.name }]);
        setNewTagName("");
      }
    } finally {
      setCreating(false);
    }
  }

  const exactMatch = allTags.some((t) => t.name.toLowerCase() === newTagName.toLowerCase());

  return (
    <Modal open={open} onClose={onClose} title="태그 설정" maxWidth="max-w-md">
      <div className="p-4 space-y-3">
        {/* 선택된 태그 */}
        {value.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {value.map((t) => (
              <span key={t.id} className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs font-medium px-2.5 py-1 rounded-full">
                {t.name}
                <button onClick={() => onChange(value.filter((v) => v.id !== t.id))} className="hover:text-indigo-900">
                  <XIcon className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* 검색 */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="태그 검색…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* 태그 목록 */}
        <div className="h-60 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-sm text-center text-gray-400 py-4">태그 없음</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {filtered.map((t) => (
                <button
                  key={t.id}
                  onClick={() => toggle(t)}
                  className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${
                    selectedIds.has(t.id)
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-gray-700 border-gray-200 hover:border-indigo-300 hover:text-indigo-700"
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {!hideCreate && (
          <>
            {/* 새 태그 추가 */}
            <div className="flex gap-2 border-t border-gray-100 pt-3">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !exactMatch && createTag()}
                placeholder="새 태그 이름…"
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={createTag}
                disabled={!newTagName.trim() || exactMatch || creating}
                className="flex items-center gap-1.5 px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                <PlusIcon className="w-4 h-4" />
                추가
              </button>
            </div>
            {exactMatch && newTagName.trim() && (
              <p className="text-xs text-amber-600 -mt-1">이미 존재하는 태그입니다</p>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
