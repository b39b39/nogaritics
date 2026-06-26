"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImageUploadModal } from "@/components/ui/ImageUploadModal";

interface UserData {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  banner: string | null;
  blockColor: string | null;
  blockTextColor: string | null;
}

const DEFAULT_BLOCK_COLOR = "#1e293b";
const DEFAULT_TEXT_COLOR = "#f8fafc";

export function UserEditClient({ user }: { user: UserData }) {
  const router = useRouter();
  const [name, setName] = useState(user.name ?? "");
  const [username, setUsername] = useState(user.username ?? "");
  const [image, setImage] = useState(user.image ?? "");
  const [banner, setBanner] = useState(user.banner ?? "");
  const [blockColor, setBlockColor] = useState(user.blockColor ?? DEFAULT_BLOCK_COLOR);
  const [blockTextColor, setBlockTextColor] = useState(user.blockTextColor ?? DEFAULT_TEXT_COLOR);

  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [bannerModalOpen, setBannerModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name || null, username: username || null, image: image || null, banner: banner || null, blockColor, blockTextColor }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Save failed"); return; }
      // Redirect to new handle (username or id)
      const newHandle = data.username ?? data.id;
      router.push(`/user/${newHandle}`);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const previewBg = blockColor || DEFAULT_BLOCK_COLOR;
  const previewText = blockTextColor || DEFAULT_TEXT_COLOR;

  return (
    <div className="space-y-6">

      {/* Preview — identical dimensions to actual profile page */}
      <div className="rounded-2xl overflow-hidden" style={{ height: "320px" }}>
        <div className="relative w-full bg-gray-300" style={{ height: "70%" }}>
          {banner ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={banner} alt="Banner preview" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500" />
          )}
        </div>
        <div className="relative flex items-center px-6 gap-4" style={{ height: "30%", backgroundColor: previewBg, color: previewText }}>
          <div className="absolute left-6 -top-10">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="Avatar" className="w-20 h-20 rounded-full object-cover" style={{ boxShadow: `0 0 0 4px ${previewText}` }} />
            ) : (
              <div className="w-20 h-20 rounded-full bg-indigo-200 flex items-center justify-center text-2xl font-bold text-indigo-700" style={{ boxShadow: `0 0 0 4px ${previewText}` }}>
                {name?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
          </div>
          <div className="pl-24 flex-1 min-w-0">
            <p className="font-bold text-lg leading-tight truncate" style={{ color: previewText }}>{name || "Name"}</p>
            {username && <p className="text-sm opacity-60 leading-tight">@{username}</p>}
            <div className="flex gap-4 mt-1 text-sm opacity-70">
              <span><span className="font-bold">—</span> ratings</span>
              <span><span className="font-bold">—</span> starred</span>
            </div>
          </div>
        </div>
      </div>

      {/* Fields */}
      <div className="space-y-4">
        {/* Images */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Profile image</label>
            <button
              type="button"
              onClick={() => setImageModalOpen(true)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:border-indigo-300 transition-colors text-left truncate"
            >
              {image ? "Change image" : "Upload image"}
            </button>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Banner</label>
            <button
              type="button"
              onClick={() => setBannerModalOpen(true)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:border-indigo-300 transition-colors text-left truncate"
            >
              {banner ? "Change banner" : "Upload banner"}
            </button>
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Display name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        {/* Username */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Username <span className="normal-case font-normal text-gray-400">(letters, numbers, _ - .)</span></label>
          <div className="flex items-center border border-gray-200 rounded-lg focus-within:ring-2 focus-within:ring-indigo-400 overflow-hidden">
            <span className="px-3 py-2 text-sm text-gray-400 bg-gray-50 border-r border-gray-200">@</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="handle"
              className="flex-1 px-3 py-2 text-sm focus:outline-none"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">Used as your profile URL: /user/{username || "handle"}</p>
        </div>

        {/* Colors */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Block color</label>
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-1.5">
              <input type="color" value={blockColor} onChange={(e) => setBlockColor(e.target.value)} className="w-8 h-7 rounded cursor-pointer border-0 bg-transparent p-0" />
              <span className="text-sm text-gray-600 font-mono">{blockColor}</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Text color</label>
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-1.5">
              <input type="color" value={blockTextColor} onChange={(e) => setBlockTextColor(e.target.value)} className="w-8 h-7 rounded cursor-pointer border-0 bg-transparent p-0" />
              <span className="text-sm text-gray-600 font-mono">{blockTextColor}</span>
            </div>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={() => router.back()}
          className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={save}
          disabled={saving}
          className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      <ImageUploadModal
        open={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        category="artists"
        crop={{ aspect: 1 }}
        forceCrop
        onComplete={(url: string) => { setImage(url); setImageModalOpen(false); }}
      />
      <ImageUploadModal
        open={bannerModalOpen}
        onClose={() => setBannerModalOpen(false)}
        category="banners"
        crop={{ aspect: 16 / 5 }}
        forceCrop
        onComplete={(url: string) => { setBanner(url); setBannerModalOpen(false); }}
      />
    </div>
  );
}
