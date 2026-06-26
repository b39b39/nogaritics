"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { ImageIcon, UploadIcon, XIcon } from "lucide-react";

interface Props {
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  category?: string;
}

export function ImageUpload({ value, onChange, label = "이미지", category = "albums" }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("category", category);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "업로드 실패");
      }
      const { url } = await res.json();
      onChange(url);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "업로드 실패");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-start gap-3">
        <div
          className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden cursor-pointer hover:border-indigo-400 transition-colors flex-shrink-0 bg-gray-50"
          onClick={() => inputRef.current?.click()}
        >
          {value ? (
            <Image src={value} alt="" width={96} height={96} className="w-full h-full object-cover" unoptimized />
          ) : (
            <ImageIcon className="w-8 h-8 text-gray-300" />
          )}
        </div>
        <div className="flex flex-col gap-1.5 pt-1">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <UploadIcon className="w-3.5 h-3.5" />
            {uploading ? "업로드 중…" : "파일 선택"}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              <XIcon className="w-3.5 h-3.5" />
              제거
            </button>
          )}
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
    </div>
  );
}
