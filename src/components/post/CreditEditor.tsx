"use client";

import { useState } from "react";
import { PlusIcon, XIcon } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ArtistSearchModal } from "@/components/post/ArtistSearchModal";
import type { SelectedArtist } from "@/components/post/ArtistRolePicker";

type ArtistRole = "MAIN" | "FEAT" | "PROD";

interface Props {
  open: boolean;
  onClose: () => void;
  value: SelectedArtist[];
  onChange: (artists: SelectedArtist[]) => void;
}

const ROLE_LABELS: Record<ArtistRole, string> = { MAIN: "-", FEAT: "feat", PROD: "prod" };

function getKey(a: SelectedArtist): string {
  return a.id ?? `itunes-${a.itunesArtistId ?? a.name}`;
}

export function CreditEditor({ open, onClose, value, onChange }: Props) {
  const [artistSearchOpen, setArtistSearchOpen] = useState(false);

  function update(key: string, patch: Partial<SelectedArtist>) {
    onChange(value.map((a) => (getKey(a) === key ? { ...a, ...patch } : a)));
  }

  function remove(key: string) {
    onChange(value.filter((a) => getKey(a) !== key));
  }

  const existingIds = value.map((a) => a.id).filter((id): id is string => id !== null);

  return (
    <>
      <Modal open={open} onClose={onClose} title="아티스트 크레딧 편집" maxWidth="max-w-2xl">
        <div className="p-4 space-y-3">
          {value.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 border-b border-gray-100">
                    <th className="text-left font-medium pb-2 pr-3">아티스트</th>
                    <th className="text-left font-medium pb-2 pr-3 w-24">역할</th>
                    <th className="text-left font-medium pb-2 pr-3">비고</th>
                    <th className="text-center font-medium pb-2 w-12">표시</th>
                    <th className="w-8 pb-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {value.map((a) => {
                    const key = getKey(a);
                    return (
                      <tr key={key} className="group">
                        <td className="py-2 pr-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 truncate max-w-[160px]">{a.name}</span>
                            {!a.id && (
                              <span className="text-xs bg-amber-100 text-amber-700 rounded px-1.5 py-0.5 flex-shrink-0">신규</span>
                            )}
                          </div>
                        </td>
                        <td className="py-2 pr-3">
                          <select
                            value={a.role}
                            onChange={(e) => update(key, { role: e.target.value as ArtistRole })}
                            className="text-xs border border-gray-200 rounded px-1.5 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full"
                          >
                            {(Object.entries(ROLE_LABELS) as [ArtistRole, string][]).map(([r, label]) => (
                              <option key={r} value={r}>{label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 pr-3">
                          <input
                            type="text"
                            value={a.note ?? ""}
                            onChange={(e) => update(key, { note: e.target.value })}
                            placeholder="비고 (선택)"
                            className="text-xs border border-gray-200 rounded px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-gray-300"
                          />
                        </td>
                        <td className="py-2 text-center">
                          <input
                            type="checkbox"
                            checked={a.showInOverview ?? true}
                            onChange={(e) => update(key, { showInOverview: e.target.checked })}
                            className="w-4 h-4 accent-indigo-600"
                            title="개요에 표시"
                          />
                        </td>
                        <td className="py-2">
                          <button
                            type="button"
                            onClick={() => remove(key)}
                            className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <XIcon className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-center text-gray-400 py-4">아티스트 없음</p>
          )}

          <button
            type="button"
            onClick={() => setArtistSearchOpen(true)}
            className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            아티스트 추가
          </button>

          <div className="flex justify-end pt-2 border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-5 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              확인
            </button>
          </div>
        </div>
      </Modal>

      <ArtistSearchModal
        open={artistSearchOpen}
        onClose={() => setArtistSearchOpen(false)}
        excludeIds={existingIds}
        onSelect={(artist) => {
          if (value.some((a) => getKey(a) === getKey(artist))) return;
          onChange([...value, { ...artist, showInOverview: true, note: "" }]);
        }}
      />
    </>
  );
}
