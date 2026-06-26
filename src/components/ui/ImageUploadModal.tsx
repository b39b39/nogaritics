"use client";

import { useState, useRef, useEffect } from "react";
import { UploadCloudIcon, LinkIcon } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import type { ImageCategory } from "@/lib/r2";

export type CropConfig =
  | { aspect: number }
  | { w: number; h: number }
  | null;

interface Props {
  open: boolean;
  onClose: () => void;
  onComplete: (url: string) => void;
  crop?: CropConfig;
  category?: ImageCategory;
  forceCrop?: boolean; // when true, trusted URLs also go through crop
}

interface CropRect { x: number; y: number; w: number; h: number; }
interface DragState { type: "move" | "se"; startMX: number; startMY: number; startCrop: CropRect; }

const TRUSTED = [
  "is1-ssl.mzstatic.com", "is2-ssl.mzstatic.com", "is3-ssl.mzstatic.com",
  "is4-ssl.mzstatic.com", "is5-ssl.mzstatic.com",
  "yt3.googleusercontent.com", "i.scdn.co", "mosaic.scdn.co",
];

function isTrusted(url: string): boolean {
  try {
    return TRUSTED.includes(new URL(url).hostname);
  } catch {
    return false;
  }
}

const MAX = 440;

export function ImageUploadModal({ open, onClose, onComplete, crop: cropCfg = null, category = "tracks", forceCrop = false }: Props) {
  const [tab, setTab] = useState<"file" | "url">("file");
  const [urlInput, setUrlInput] = useState("");
  const [phase, setPhase] = useState<"input" | "crop" | "uploading">("input");
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [naturalW, setNaturalW] = useState(0);
  const [displayW, setDisplayW] = useState(0);
  const [displayH, setDisplayH] = useState(0);
  const [crop, setCrop] = useState<CropRect>({ x: 0, y: 0, w: 0, h: 0 });
  const [drag, setDrag] = useState<DragState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setTab("file");
      setUrlInput("");
      setPhase("input");
      setPreviewSrc(null);
      setError(null);
      setDrag(null);
    }
  }, [open]);

  function calcCrop(dw: number, dh: number) {
    if (!cropCfg) return;
    const aspect = "aspect" in cropCfg ? cropCfg.aspect : cropCfg.w / cropCfg.h;
    let cw: number, ch: number;
    if (dw / dh >= aspect) { ch = dh; cw = Math.round(ch * aspect); }
    else { cw = dw; ch = Math.round(cw / aspect); }
    setCrop({ x: Math.round((dw - cw) / 2), y: Math.round((dh - ch) / 2), w: cw, h: ch });
  }

  function handleImageLoad() {
    const img = imgRef.current;
    if (!img) return;
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    setNaturalW(nw);
    const scale = Math.min(MAX / nw, MAX / nh, 1);
    const dw = Math.round(nw * scale);
    const dh = Math.round(nh * scale);
    setDisplayW(dw);
    setDisplayH(dh);
    calcCrop(dw, dh);
  }

  function enterCrop(src: string) {
    setPreviewSrc(src);
    setPhase("crop");
  }

  async function uploadFile(file: File): Promise<string> {
    const form = new FormData();
    form.append("file", file);
    form.append("category", category);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "업로드 실패");
    return data.url;
  }

  async function handleUrlSubmit() {
    const url = urlInput.trim();
    if (!url) return;
    setError(null);
    if (isTrusted(url) && !forceCrop) {
      onComplete(url);
      onClose();
      return;
    }
    if (cropCfg) { enterCrop(url); return; }
    onComplete(url);
    onClose();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    if (cropCfg) { enterCrop(URL.createObjectURL(file)); return; }
    setPhase("uploading");
    try {
      const url = await uploadFile(file);
      onComplete(url);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "업로드 실패");
      setPhase("input");
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file?.type.startsWith("image/")) return;
    setError(null);
    if (cropCfg) { enterCrop(URL.createObjectURL(file)); return; }
    setPhase("uploading");
    uploadFile(file).then((url) => { onComplete(url); onClose(); })
      .catch((err) => { setError(err.message); setPhase("input"); });
  }

  async function handleCropConfirm() {
    const img = imgRef.current;
    if (!img || !displayW) return;
    setPhase("uploading");

    const scale = naturalW / displayW;
    const sx = Math.round(crop.x * scale);
    const sy = Math.round(crop.y * scale);
    const sw = Math.round(crop.w * scale);
    const sh = Math.round(crop.h * scale);
    const outW = cropCfg && "w" in cropCfg ? cropCfg.w : sw;
    const outH = cropCfg && "h" in cropCfg ? cropCfg.h : sh;

    const canvas = document.createElement("canvas");
    canvas.width = outW; canvas.height = outH;
    const ctx = canvas.getContext("2d");
    if (!ctx) { setPhase("crop"); return; }

    try { ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH); }
    catch { setError("이미지를 자를 수 없습니다 (CORS). 파일로 업로드해주세요."); setPhase("crop"); return; }

    canvas.toBlob(async (blob) => {
      if (!blob) { setPhase("crop"); return; }
      try {
        const file = new File([blob], "image.jpg", { type: "image/jpeg" });
        const url = await uploadFile(file);
        onComplete(url);
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "업로드 실패");
        setPhase("crop");
      }
    }, "image/jpeg", 0.92);
  }

  function ptrDown(e: React.PointerEvent, type: "move" | "se") {
    e.preventDefault(); e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDrag({ type, startMX: e.clientX, startMY: e.clientY, startCrop: { ...crop } });
  }

  function ptrMove(e: React.PointerEvent) {
    if (!drag) return;
    const dx = e.clientX - drag.startMX;
    const dy = e.clientY - drag.startMY;
    if (drag.type === "move") {
      setCrop((c) => ({
        ...c,
        x: Math.max(0, Math.min(displayW - drag.startCrop.w, drag.startCrop.x + dx)),
        y: Math.max(0, Math.min(displayH - drag.startCrop.h, drag.startCrop.y + dy)),
      }));
    } else {
      const asp = drag.startCrop.w / drag.startCrop.h;
      let nw = Math.max(40, drag.startCrop.w + dx);
      let nh = Math.round(nw / asp);
      nw = Math.min(nw, displayW - drag.startCrop.x);
      nh = Math.min(nh, displayH - drag.startCrop.y);
      if (nw / nh > asp) nw = Math.round(nh * asp); else nh = Math.round(nw / asp);
      setCrop((c) => ({ ...c, w: nw, h: nh }));
    }
  }

  if (!open) return null;

  if (phase === "crop" && previewSrc) {
    return (
      <Modal open title="이미지 크롭" onClose={onClose} maxWidth="max-w-2xl">
        <div className="p-5 space-y-4">
          <div
            className="relative mx-auto select-none overflow-hidden rounded-lg bg-gray-900"
            style={{ width: displayW || 440, height: displayH || 300 }}
            onPointerMove={ptrMove}
            onPointerUp={() => setDrag(null)}
            onPointerLeave={() => setDrag(null)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={previewSrc}
              alt=""
              crossOrigin="anonymous"
              className="absolute inset-0 w-full h-full"
              style={{ objectFit: "fill" }}
              onLoad={handleImageLoad}
              draggable={false}
            />
            {displayW > 0 && (
              <>
                <div className="absolute pointer-events-none bg-black/55" style={{ top: 0, left: 0, right: 0, height: crop.y }} />
                <div className="absolute pointer-events-none bg-black/55" style={{ top: crop.y + crop.h, left: 0, right: 0, bottom: 0 }} />
                <div className="absolute pointer-events-none bg-black/55" style={{ top: crop.y, left: 0, width: crop.x, height: crop.h }} />
                <div className="absolute pointer-events-none bg-black/55" style={{ top: crop.y, left: crop.x + crop.w, right: 0, height: crop.h }} />
                <div
                  className="absolute border-2 border-white/80 cursor-move"
                  style={{ left: crop.x, top: crop.y, width: crop.w, height: crop.h }}
                  onPointerDown={(e) => ptrDown(e, "move")}
                >
                  <div
                    className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-white rounded-sm cursor-se-resize"
                    style={{ transform: "translate(50%,50%)" }}
                    onPointerDown={(e) => ptrDown(e, "se")}
                  />
                </div>
              </>
            )}
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">취소</button>
            <button
              onClick={handleCropConfirm}
              disabled={!displayW}
              className="px-5 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              적용
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  if (phase === "uploading") {
    return (
      <Modal open title="이미지 업로드" onClose={onClose}>
        <div className="p-8 text-center text-sm text-gray-400">업로드 중…</div>
      </Modal>
    );
  }

  return (
    <Modal open title="이미지 업로드" onClose={onClose}>
      <div className="p-5 space-y-4">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(["file", "url"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 text-sm py-1.5 rounded-md transition-colors ${tab === t ? "bg-white shadow-sm font-medium text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
            >
              {t === "file" ? "파일 업로드" : "URL 입력"}
            </button>
          ))}
        </div>

        {tab === "file" && (
          <div
            className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <UploadCloudIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">파일을 드래그하거나 클릭해서 선택</p>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP, GIF · 최대 5MB</p>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>
        )}

        {tab === "url" && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
                  placeholder="https://…"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                onClick={handleUrlSubmit}
                disabled={!urlInput.trim()}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                확인
              </button>
            </div>
            {urlInput.trim() && !forceCrop && (
              <p className={`text-xs ${isTrusted(urlInput) ? "text-green-600" : "text-gray-400"}`}>
                {isTrusted(urlInput) ? "✓ 신뢰 도메인 — URL 그대로 저장" : "외부 URL — 그대로 저장됩니다"}
              </p>
            )}
          </div>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    </Modal>
  );
}
