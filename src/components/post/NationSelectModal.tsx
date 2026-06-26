"use client";

import { useState, useEffect, useRef } from "react";
import { SearchIcon, CheckIcon } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { koreanIncludes } from "@/lib/hangul";

export interface CountryItem {
  code: string;
  name: string;
}

// Single-select variant
interface SingleProps {
  open: boolean;
  onClose: () => void;
  countries: CountryItem[];
  multi?: false;
  value: string | null;
  onChange: (code: string | null) => void;
}

// Multi-select variant
interface MultiProps {
  open: boolean;
  onClose: () => void;
  countries: CountryItem[];
  multi: true;
  value: string[];
  onChange: (codes: string[]) => void;
}

type Props = SingleProps | MultiProps;

export function NationSelectModal(props: Props) {
  const { open, onClose, countries } = props;
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  const filtered = (() => {
    if (!query.trim()) return countries;
    const q = query.toLowerCase();
    const matched = countries.filter(
      (c) => koreanIncludes(c.name, query) || c.code.toLowerCase().includes(q),
    );
    return matched.sort((a, b) => {
      const rankA = a.name.toLowerCase().startsWith(q) ? 0 : 1;
      const rankB = b.name.toLowerCase().startsWith(q) ? 0 : 1;
      return rankA - rankB || a.name.localeCompare(b.name, "ko");
    });
  })();

  function isSelected(code: string): boolean {
    if (props.multi) return props.value.includes(code);
    return props.value === code;
  }

  function handleSelect(code: string) {
    if (props.multi) {
      const next = props.value.includes(code)
        ? props.value.filter((c) => c !== code)
        : [...props.value, code];
      props.onChange(next);
    } else {
      props.onChange(props.value === code ? null : code);
      onClose();
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="국적 선택">
      <div className="flex flex-col gap-3">
        {/* Search */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="국가명 또는 코드 검색…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* List */}
        <div className="h-96 overflow-y-auto overflow-x-hidden">
          {/* Clear option (single mode only) */}
          {!props.multi && (
            <button
              type="button"
              onClick={() => { props.onChange(null); onClose(); }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-400"
            >
              <span className="w-6 h-4 flex items-center justify-center text-gray-300">—</span>
              <span>선택 안 함</span>
            </button>
          )}

          {filtered.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => handleSelect(c.code)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm ${
                isSelected(c.code) ? "bg-indigo-50" : ""
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/flag?code=${c.code}`}
                alt={c.code}
                width={24}
                height={16}
                className="w-6 h-4 object-cover rounded-[2px] flex-shrink-0"
              />
              <span className={`flex-1 text-left font-medium ${isSelected(c.code) ? "text-indigo-700" : "text-gray-900"}`}>
                {c.name}
              </span>
              <span className="text-xs text-gray-400 font-mono w-6">{c.code}</span>
              {isSelected(c.code) && <CheckIcon className="w-4 h-4 text-indigo-600 flex-shrink-0" />}
            </button>
          ))}

          {filtered.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-6">검색 결과가 없습니다.</p>
          )}
        </div>
      </div>
    </Modal>
  );
}
