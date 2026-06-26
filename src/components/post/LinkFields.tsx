"use client";

import { LinkIcon } from "lucide-react";

interface LinkDef {
  key: string;
  label: string;
  placeholder: string;
}

interface Props {
  links: Record<string, string>;
  onChange: (key: string, value: string) => void;
  defs: LinkDef[];
}

export function LinkFields({ links, onChange, defs }: Props) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">외부 링크</label>
      <div className="space-y-2">
        {defs.map((def) => (
          <div key={def.key} className="flex items-center gap-2">
            <span className="w-28 text-xs font-medium text-gray-500 flex-shrink-0">{def.label}</span>
            <div className="relative flex-1">
              <LinkIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <input
                type="url"
                value={links[def.key] ?? ""}
                onChange={(e) => onChange(def.key, e.target.value)}
                placeholder={def.placeholder}
                className="w-full pl-7 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export const TRACK_ALBUM_LINK_DEFS: LinkDef[] = [
  { key: "youtubeUrl",      label: "YouTube",       placeholder: "https://youtube.com/watch?v=…" },
  { key: "youtubeMusicUrl", label: "YouTube Music", placeholder: "https://music.youtube.com/…" },
  { key: "appleMusicUrl",   label: "Apple Music",   placeholder: "https://music.apple.com/kr/album/…" },
  { key: "soundcloudUrl",   label: "SoundCloud",    placeholder: "https://soundcloud.com/…" },
];

export const ARTIST_LINK_DEFS: LinkDef[] = [
  { key: "xUrl",            label: "X (Twitter)",   placeholder: "https://x.com/…" },
  { key: "instagramUrl",    label: "Instagram",     placeholder: "https://instagram.com/…" },
  { key: "youtubeUrl",      label: "YouTube",       placeholder: "https://youtube.com/@…" },
  { key: "youtubeMusicUrl", label: "YouTube Music", placeholder: "https://music.youtube.com/…" },
  { key: "appleMusicUrl",   label: "Apple Music",   placeholder: "https://music.apple.com/kr/artist/…" },
  { key: "soundcloudUrl",   label: "SoundCloud",    placeholder: "https://soundcloud.com/…" },
];
