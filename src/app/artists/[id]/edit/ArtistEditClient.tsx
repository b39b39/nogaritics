"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ImageIcon, XIcon, GlobeIcon, TagsIcon, UsersIcon } from "lucide-react";
import { TagSelectModal } from "@/components/post/TagSelectModal";
import { NationSelectModal, type CountryItem } from "@/components/post/NationSelectModal";
import { ArtistSearchModal } from "@/components/post/ArtistSearchModal";
import { ImageUploadModal } from "@/components/ui/ImageUploadModal";
import { LinkFields, ARTIST_LINK_DEFS } from "@/components/post/LinkFields";
import { ExternalLinks } from "@/components/ui/ExternalLinks";
import { Badge } from "@/components/ui/Badge";
import { updateArtist } from "@/app/actions/update";
import type { SelectedTag } from "@/components/post/TagPicker";
import type { SelectedArtist } from "@/components/post/ArtistRolePicker";

interface MemberItem {
  id: string | null;
  tempKey: string;
  name: string;
  image: string | null;
  itunesArtistId?: string;
  appleMusicUrl?: string | null;
}

export interface ArtistEditInitial {
  id: string;
  name: string;
  aliases: string[];
  isGroup: boolean;
  nation: string | null;
  image: string | null;
  banner: string | null;
  tags: { id: string; name: string }[];
  members: { id: string; name: string; image: string | null }[];
  xUrl: string | null;
  instagramUrl: string | null;
  youtubeUrl: string | null;
  youtubeMusicUrl: string | null;
  appleMusicUrl: string | null;
  soundcloudUrl: string | null;
}

interface Props {
  data: ArtistEditInitial;
  countries: CountryItem[];
}

const inputCls =
  "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";

export function ArtistEditClient({ data, countries }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(data.name);
  const [aliasInput, setAliasInput] = useState(data.aliases.join(", "));
  const [isGroup, setIsGroup] = useState(data.isGroup);
  const [nation, setNation] = useState<string | null>(data.nation);
  const [image, setImage] = useState<string | null>(data.image);
  const [banner, setBanner] = useState<string | null>(data.banner);
  const [tags, setTags] = useState<SelectedTag[]>(data.tags);
  const [members, setMembers] = useState<MemberItem[]>(
    data.members.map((m) => ({ ...m, tempKey: m.id })),
  );
  const [links, setLinks] = useState<Record<string, string>>({
    xUrl: data.xUrl ?? "",
    instagramUrl: data.instagramUrl ?? "",
    youtubeUrl: data.youtubeUrl ?? "",
    youtubeMusicUrl: data.youtubeMusicUrl ?? "",
    appleMusicUrl: data.appleMusicUrl ?? "",
    soundcloudUrl: data.soundcloudUrl ?? "",
  });
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [bannerModalOpen, setBannerModalOpen] = useState(false);
  const [nationModalOpen, setNationModalOpen] = useState(false);
  const [tagSelectOpen, setTagSelectOpen] = useState(false);
  const [memberSearchOpen, setMemberSearchOpen] = useState(false);

  const nationLabel = nation
    ? (countries.find((c) => c.code === nation)?.name ?? nation)
    : null;

  function addMember(selected: SelectedArtist) {
    const isDup = members.some(
      (m) =>
        (selected.id && m.id === selected.id) ||
        (selected.itunesArtistId && m.itunesArtistId === selected.itunesArtistId),
    );
    if (isDup) return;
    setMembers([...members, {
      id: selected.id ?? null,
      tempKey: selected.id ?? selected.itunesArtistId ?? String(Date.now()),
      name: selected.name,
      image: selected.image ?? null,
      itunesArtistId: selected.itunesArtistId,
      appleMusicUrl: selected.appleMusicUrl,
    }]);
  }

  function removeMember(tempKey: string) {
    setMembers(members.filter((m) => m.tempKey !== tempKey));
  }

  function handleSubmit() {
    if (!name.trim()) { setError("이름을 입력하세요."); return; }
    setError(null);

    startTransition(async () => {
      try {
        const resolvedIds = await Promise.all(
          members.map(async (m) => {
            if (m.id) return m.id;
            const res = await fetch("/api/artists", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: m.name,
                image: m.image,
                itunesArtistId: m.itunesArtistId ?? null,
                appleMusicUrl: m.appleMusicUrl ?? null,
              }),
            });
            if (!res.ok) throw new Error(`멤버 "${m.name}" 등록 실패`);
            const created = await res.json();
            return created.id as string;
          }),
        );

        const result = await updateArtist(data.id, {
          name: name.trim(),
          aliases: aliasInput.split(",").map((s) => s.trim()).filter(Boolean),
          isGroup,
          nation,
          image,
          banner,
          tagIds: tags.map((t) => t.id),
          memberIds: resolvedIds,
          xUrl: links.xUrl || null,
          instagramUrl: links.instagramUrl || null,
          youtubeUrl: links.youtubeUrl || null,
          youtubeMusicUrl: links.youtubeMusicUrl || null,
          appleMusicUrl: links.appleMusicUrl || null,
          soundcloudUrl: links.soundcloudUrl || null,
        });

        if (result.ok) {
          router.push(`/artists/${data.id}.svg`);
          router.refresh();
        } else {
          setError(result.error ?? "저장 실패");
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "멤버 등록 중 오류 발생");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* ── Overview preview ────────────────────────────────────────── */}
      <div>
        <div className="rounded-2xl overflow-hidden">
          {/* Banner — h-52 to match artist page exactly */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setBannerModalOpen(true)}
            onKeyDown={(e) => e.key === "Enter" && setBannerModalOpen(true)}
            className="relative w-full h-52 bg-gradient-to-br from-gray-800 to-gray-900 block group cursor-pointer focus:outline-none"
            title="배너 이미지 변경"
          >
            {banner && (
              <Image src={banner} alt="" fill className="object-cover" />
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-medium">
              <ImageIcon className="w-4 h-4" />
              배너 이미지 변경
            </div>
            {banner && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setBanner(null); }}
                className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors z-10"
              >
                <XIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Black section — identical structure to artist page */}
          <div className="bg-black px-6 pb-8 text-center">
            <div className="-mt-16 mb-4 flex justify-center">
              <button
                type="button"
                onClick={() => setImageModalOpen(true)}
                className="relative w-32 h-32 rounded-full ring-4 ring-black overflow-hidden bg-gray-700 group focus:outline-none flex-shrink-0"
              >
                {image ? (
                  <Image src={image} alt="" fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-4xl font-bold">
                    {name[0]?.toUpperCase()}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-full">
                  <ImageIcon className="w-6 h-6 text-white" />
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-white/30 pointer-events-none" />
              </button>
            </div>

            {/* Name + flag */}
            <div className="flex items-center justify-center gap-2.5 flex-wrap">
              <p className="text-3xl font-bold text-white leading-tight">
                {name || <span className="text-white/30">이름 미설정</span>}
              </p>
              {nation && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/flags/${nation}.svg`} alt={nation} className="w-7 h-auto rounded-sm flex-shrink-0" />
              )}
            </div>

            {/* Alias line */}
            {aliasInput.trim() && (
              <p className="mt-1 text-sm text-white/55">
                {aliasInput.split(",").map((s) => s.trim()).filter(Boolean).join(", ")}
              </p>
            )}

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1 mt-3">
                {tags.map((t) => (
                  <Badge key={t.id} variant="tag" className="!bg-white/15 !text-white/80 border border-white/20 hover:!bg-white/25 transition-colors">
                    {t.name}
                  </Badge>
                ))}
              </div>
            )}

            {/* External links */}
            <div className="mt-4 flex justify-center">
              <ExternalLinks links={links} />
            </div>

            {image && (
              <button
                type="button"
                onClick={() => setImage(null)}
                className="mt-3 text-xs text-red-400/70 hover:text-red-300 transition-colors"
              >
                프로필 제거
              </button>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-1.5">
          배너: 4:1 비율 권장 · 프로필: 1:1 비율 (원형으로 표시됩니다)
        </p>
      </div>

      {/* ── Name ────────────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">이름 *</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputCls}
          placeholder="아티스트 이름"
        />
      </div>

      {/* ── Alias ───────────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">별명 (쉼표로 구분)</label>
        <input
          value={aliasInput}
          onChange={(e) => setAliasInput(e.target.value)}
          className={inputCls}
          placeholder="영문명, 이전 활동명"
        />
      </div>

      {/* ── Nation ──────────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">국적</label>
        <button
          type="button"
          onClick={() => setNationModalOpen(true)}
          className="w-full flex items-center gap-2.5 px-3 py-2 border border-gray-200 rounded-lg text-sm hover:border-indigo-400 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-left"
        >
          {nation ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/flags/${nation}.svg`} alt={nation} width={20} height={14} className="w-5 h-[14px] object-cover rounded-[2px] flex-shrink-0" />
              <span className="flex-1 text-gray-900">{nationLabel}</span>
              <span className="text-xs text-gray-400 font-mono">{nation}</span>
            </>
          ) : (
            <>
              <GlobeIcon className="w-4 h-4 text-gray-400" />
              <span className="flex-1 text-gray-400">선택 안 함</span>
            </>
          )}
        </button>
      </div>

      {/* ── Group toggle ────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsGroup((v) => !v)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isGroup ? "bg-indigo-600" : "bg-gray-200"}.svg`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${isGroup ? "translate-x-6" : "translate-x-1"}.svg`}
          />
        </button>
        <label className="text-sm font-medium text-gray-700">그룹 아티스트</label>
      </div>

      {/* ── Members (group only) ─────────────────────────────────────── */}
      {isGroup && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">멤버</label>
            <button
              type="button"
              onClick={() => setMemberSearchOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <UsersIcon className="w-3.5 h-3.5" />
              멤버 추가
            </button>
          </div>
          {members.length > 0 ? (
            <div className="space-y-1.5">
              {members.map((m) => (
                <div
                  key={m.tempKey}
                  className="flex items-center gap-2.5 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100"
                >
                  <div className="relative w-7 h-7 rounded-full overflow-hidden bg-gray-300 flex-shrink-0">
                    {m.image ? (
                      <Image src={m.image} alt={m.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs font-bold">
                        {m.name[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className="text-sm flex-1 truncate">{m.name}</span>
                  {!m.id && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-600 flex-shrink-0">
                      신규
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeMember(m.tempKey)}
                    className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-lg">
              멤버가 없습니다. 위 버튼으로 추가하세요.
            </p>
          )}
        </div>
      )}

      {/* ── Tags ────────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">태그</label>
          <button
            type="button"
            onClick={() => setTagSelectOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            <TagsIcon className="w-3.5 h-3.5" />
            태그 편집
          </button>
        </div>
        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <span
                key={t.id}
                className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs font-medium px-2.5 py-1 rounded-full"
              >
                {t.name}
                <button
                  type="button"
                  onClick={() => setTags(tags.filter((x) => x.id !== t.id))}
                  className="hover:text-indigo-900"
                >
                  <XIcon className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">태그 없음</p>
        )}
      </div>

      {/* ── External links ───────────────────────────────────────────── */}
      <LinkFields
        links={links}
        onChange={(key, val) => setLinks((prev) => ({ ...prev, [key]: val }))}
        defs={ARTIST_LINK_DEFS}
      />

      {/* ── Error ───────────────────────────────────────────────────── */}
      {error && (
        <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      {/* ── Actions ─────────────────────────────────────────────────── */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          취소
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          className="px-6 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? "저장 중…" : "저장"}
        </button>
      </div>

      {/* ── Modals ──────────────────────────────────────────────────── */}
      <ImageUploadModal
        open={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        onComplete={(url) => setImage(url)}
        crop={{ aspect: 1 }}
        category="artists"
      />
      <ImageUploadModal
        open={bannerModalOpen}
        onClose={() => setBannerModalOpen(false)}
        onComplete={(url) => setBanner(url)}
        crop={{ aspect: 4 }}
        category="artists"
      />
      <NationSelectModal
        open={nationModalOpen}
        onClose={() => setNationModalOpen(false)}
        value={nation}
        onChange={setNation}
        countries={countries}
      />
      <TagSelectModal
        open={tagSelectOpen}
        onClose={() => setTagSelectOpen(false)}
        value={tags}
        onChange={setTags}
      />
      <ArtistSearchModal
        open={memberSearchOpen}
        onClose={() => setMemberSearchOpen(false)}
        onSelect={addMember}
        excludeIds={[data.id, ...members.filter((m) => m.id !== null).map((m) => m.id as string)]}
      />
    </div>
  );
}
