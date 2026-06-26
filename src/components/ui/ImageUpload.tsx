"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { UploadIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ImageCategory } from "@/lib/r2";

interface ImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  category: ImageCategory;
  shape?: "square" | "circle";
  className?: string;
}

export function ImageUpload({ value, onChange, category, shape = "square", className }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);

    const fd = new FormData();
    fd.append("file", file);
    fd.append("category", category);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "업로드 실패");
      onChange(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "업로드 중 오류 발생");
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <div className={cn("relative", className)}>
      {value ? (
        <div className={cn("relative overflow-hidden", shape === "circle" ? "rounded-full" : "rounded-xl", "w-32 h-32")}>
          <Image src={value} alt="uploaded" fill className="object-cover" sizes="128px" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-black/80"
          >
            <XIcon className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className={cn(
            "w-32 h-32 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors",
            shape === "circle" ? "rounded-full" : "rounded-xl",
            uploading && "opacity-60 pointer-events-none"
          )}
        >
          {uploading ? (
            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <UploadIcon className="w-6 h-6 text-gray-400 mb-1" />
              <span className="text-xs text-gray-400">이미지 업로드</span>
            </>
          )}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
