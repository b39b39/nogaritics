"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StarIcon, ImageIcon, XIcon, UsersIcon, DiscIcon, TagsIcon, TrashIcon } from "lucide-react";
import { ItunesSearch } from "@/components/post/ItunesSearch";
import { CreditEditor } from "@/components/post/CreditEditor";
import { AlbumSearchModal } from "@/components/post/AlbumSearchModal";
import { TagSelectModal } from "@/components/post/TagSelectModal";
import { ImageUploadModal } from "@/components/ui/ImageUploadModal";
import { LinkFields, TRACK_ALBUM_LINK_DEFS } from "@/components/post/LinkFields";
import { ArtistCreditDisplay } from "@/components/music/ArtistCreditDisplay";
import { Badge } from "@/components/ui/Badge";
import { PlatformLinks } from "@/components/ui/PlatformLinks";
import { formatPublishedDate } from "@/lib/utils";
import { saveTrack, type AlbumInput } from "@/app/actions/save";
import { itunesSearchTracks, itunesLookupAlbumTracks, artworkHQ, parseItunesDate, type ItunesTrack } from "@/lib/itunes";
import type { SelectedArtist } from "@/components/post/ArtistRolePicker";
import type { SelectedAlbum, ArtistCredit, ArtistRole } from "@/types";
import type { SelectedTag } from "@/components/post/TagPicker";

interface ItunesAlbumFull {
  itunesAlbumId: string;
  name: string;
  image: string;
  publishedYear: number;
  publishedMonth: number;
  publishedDay: number;
  appleMusicUrl: string;
  itunesArtistId: string;
  artistName: string;
  artistViewUrl: string;
  tracks: {
    itunesTrackId: string;
    name: string;
    trackNumber?: number;
    appleMusicUrl?: string;
    image?: string;
    publishedYear?: number;
    publishedMonth?: number;
    publishedDay?: number;
  }[];
}

export default function PostTrackPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [aliases, setAliases] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [links, setLinks] = useState<Record<string, string>>({
    youtubeUrl: "", youtubeMusicUrl: "", appleMusicUrl: "", soundcloudUrl: "",
  });
  const [artists, setArtists] = useState<SelectedArtist[]>([]);
  const [tags, setTags] = useState<SelectedTag[]>([]);
  const [album, setAlbum] = useState<SelectedAlbum | null>(null);
  const [itunesTrackId, setItunesTrackId] = useState<string | undefined>();
  const [itunesTrackNumber, setItunesTrackNumber] = useState<number | undefined>();
  const [itunesAlbumFull, setItunesAlbumFull] = useState<ItunesAlbumFull | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [creditEditorOpen, setCreditEditorOpen] = useState(false);
  const [albumSearchOpen, setAlbumSearchOpen] = useState(false);
  const [tagSelectOpen, setTagSelectOpen] = useState(false);

  const previewCredits: ArtistCredit[] = artists.map((a) => ({
    artist: { id: a.id ?? "", name: a.name, image: a.image ?? null, nation: null, isGroup: false },
    role: a.role as ArtistRole,
    note: a.note ?? null,
    showInOverview: a.showInOverview ?? true,
  }));

  const parsedAliases = aliases.split(",").map((s) => s.trim()).filter(Boolean);
  const publishedDate = formatPublishedDate(
    year ? parseInt(year) : null,
    month ? parseInt(month) : null,
    day ? parseInt(day) : null,
  );
  const displayDate = publishedDate !== "Unknown" ? publishedDate : null;

  async function onItunesTrackSelect(track: ItunesTrack) {
    const date = parseItunesDate(track.releaseDate);
    setName(track.trackName);
    setImage(artworkHQ(track.artworkUrl100));
    setYear(String(date.year));
    setMonth(String(date.month));
    setDay(String(date.day));
    setItunesTrackId(String(track.trackId));
    setItunesTrackNumber(track.trackNumber);
    setLinks((prev) => ({ ...prev, appleMusicUrl: track.trackViewUrl }));
    setArtists([{ id: null, itunesArtistId: String(track.artistId), appleMusicUrl: track.artistViewUrl, name: track.artistName, role: "MAIN", showInOverview: true }]);

    setAlbum(null);
    setItunesAlbumFull(null);
    const { album: a, tracks } = await itunesLookupAlbumTracks(track.collectionId);
    const albumDate = parseItunesDate(a.releaseDate);
    const full: ItunesAlbumFull = {
      itunesAlbumId: String(a.collectionId),
      name: a.collectionName,
      image: artworkHQ(a.artworkUrl100),
      publishedYear: albumDate.year,
      publishedMonth: albumDate.month,
      publishedDay: albumDate.day,
      appleMusicUrl: a.collectionViewUrl,
      itunesArtistId: String(a.artistId),
      artistName: a.artistName,
      artistViewUrl: a.artistViewUrl,
      tracks: tracks.map((t) => {
        const td = parseItunesDate(t.releaseDate);
        return {
          itunesTrackId: String(t.trackId),
          name: t.trackName,
          trackNumber: t.trackNumber,
          appleMusicUrl: t.trackViewUrl,
          image: artworkHQ(t.artworkUrl100),
          publishedYear: td.year,
          publishedMonth: td.month,
          publishedDay: td.day,
        };
      }),
    };
    setItunesAlbumFull(full);
    setAlbum({ id: null, name: full.name, image: full.image, itunesAlbumId: full.itunesAlbumId, appleMusicUrl: full.appleMusicUrl });
  }

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("제목을 입력하세요."); return; }
    if (artists.length === 0) { setError("아티스트를 추가하세요."); return; }
    setError(null);

    startTransition(async () => {
      let albumInput: AlbumInput | null = null;
      if (album) {
        if (itunesAlbumFull && itunesAlbumFull.itunesAlbumId === album.itunesAlbumId) {
          const fd = itunesAlbumFull;
          albumInput = {
            itunesAlbumId: fd.itunesAlbumId,
            name: fd.name,
            image: fd.image,
            publishedYear: fd.publishedYear,
            publishedMonth: fd.publishedMonth,
            publishedDay: fd.publishedDay,
            appleMusicUrl: fd.appleMusicUrl,
            artists: [{ itunesArtistId: fd.itunesArtistId, name: fd.artistName, appleMusicUrl: fd.artistViewUrl, role: "MAIN" }],
            tracks: fd.tracks,
          };
        } else if (album.id) {
          albumInput = { id: album.id, name: album.name, artists: [], tracks: [] };
        } else if (album.itunesAlbumId) {
          albumInput = { itunesAlbumId: album.itunesAlbumId, name: album.name, image: album.image ?? undefined, appleMusicUrl: album.appleMusicUrl ?? undefined, artists: [], tracks: [] };
        }
      }

      const result = await saveTrack({
        name: name.trim(),
        aliases: aliases.split(",").map((s) => s.trim()).filter(Boolean),
        image,
        publishedYear: year ? parseInt(year) : null,
        publishedMonth: month ? parseInt(month) : null,
        publishedDay: day ? parseInt(day) : null,
        appleMusicUrl: links.appleMusicUrl || null,
        youtubeUrl: links.youtubeUrl || null,
        youtubeMusicUrl: links.youtubeMusicUrl || null,
        soundcloudUrl: links.soundcloudUrl || null,
        itunesTrackId,
        trackNumber: itunesTrackNumber,
        artists: artists.map((a) => ({
          id: a.id ?? undefined,
          itunesArtistId: a.itunesArtistId,
          name: a.name,
          image: a.image,
          appleMusicUrl: a.appleMusicUrl,
          role: a.role,
        })),
        album: albumInput,
        tagIds: tags.map((t) => t.id),
      });

      if (result.ok && result.id) {
        router.push(`/tracks/${result.id}`);
      } else {
        setError(result.error ?? "저장 실패");
      }
    });
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* 미리보기 */}
      <div className="relative rounded-2xl overflow-hidden">
        {image ? (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${image})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              transform: "scale(1.15)",
              filter: "blur(22px) brightness(0.28)",
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />
        )}

        <div className="relative z-10 p-6 flex gap-6">
          <div className="flex-shrink-0 w-[200px] h-[200px] rounded-lg overflow-hidden ring-1 ring-white/10 bg-white/10">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt={name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/30 text-3xl font-bold">
                {name[0]?.toUpperCase() ?? "?"}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-white mb-1">
              {name.trim() || <span className="opacity-30">제목 없음</span>}
            </h1>
            {parsedAliases.length > 0 && (
              <p className="text-sm text-white/55 mb-2">{parsedAliases.join(", ")}</p>
            )}
            <ArtistCreditDisplay credits={previewCredits} />
            {album && (
              <p className="mt-2 text-sm font-medium text-white/80">{album.name}</p>
            )}
            {displayDate && (
              <p className="text-sm text-white/55 mt-1">{displayDate}</p>
            )}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {tags.map((t) => (
                  <Badge key={t.id} variant="tag" className="!bg-white/15 !text-white/90 border border-white/20">
                    {t.name}
                  </Badge>
                ))}
              </div>
            )}
            <div className="mt-3">
              <PlatformLinks links={{
                youtubeUrl: links.youtubeUrl || null,
                youtubeMusicUrl: links.youtubeMusicUrl || null,
                appleMusicUrl: links.appleMusicUrl || null,
                soundcloudUrl: links.soundcloudUrl || null,
              }} />
            </div>
          </div>

          <div className="flex-shrink-0 opacity-25 pt-0.5">
            <StarIcon className="w-6 h-6 fill-none text-white stroke-[1.5]" />
          </div>
        </div>
      </div>

      {/* iTunes 검색 */}
      <ItunesSearch<ItunesTrack>
        placeholder="iTunes에서 트랙 검색…"
        label="iTunes로 자동완성 (제목 · 아티스트 · 앨범 · 발매일 · 이미지)"
        onSearch={itunesSearchTracks}
        renderResult={(t) => (
          <div className="flex items-center gap-3 px-3 py-2.5">
            {t.artworkUrl100 && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={t.artworkUrl100} alt="" className="w-9 h-9 rounded object-cover flex-shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{t.trackName}</p>
              <p className="text-xs text-gray-500 truncate">{t.artistName} · {t.collectionName}</p>
            </div>
          </div>
        )}
        onSelect={onItunesTrackSelect}
      />

      {/* 편집 폼 */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
        <h2 className="text-lg font-bold text-gray-900">트랙 추가</h2>

        <Field label="제목 *">
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="트랙 제목" />
        </Field>

        <Field label="별명 (쉼표로 구분)">
          <input value={aliases} onChange={(e) => setAliases(e.target.value)} className={inputCls} placeholder="대체 제목1, Alternative Title" />
        </Field>

        {/* 커버 이미지 */}
        <Field label="커버 이미지">
          <div className="flex items-center gap-3">
            {image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="cover" className="w-14 h-14 rounded-lg object-cover border border-gray-100 flex-shrink-0" />
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setImageModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ImageIcon className="w-4 h-4 text-gray-500" />
                {image ? "수정" : "이미지 추가"}
              </button>
              {image && (
                <button
                  type="button"
                  onClick={() => setImage(null)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
                >
                  <TrashIcon className="w-4 h-4" />
                  제거
                </button>
              )}
            </div>
          </div>
        </Field>

        {/* 아티스트 */}
        <Field label="아티스트">
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              {artists.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {artists.slice(0, 4).map((a) => (
                    <span key={a.id ?? a.name} className="text-xs bg-gray-100 text-gray-700 rounded-full px-2.5 py-1">
                      {a.name} <span className="text-gray-400">({a.role === "MAIN" ? "-" : a.role === "FEAT" ? "feat" : "prod"})</span>
                    </span>
                  ))}
                  {artists.length > 4 && (
                    <span className="text-xs text-gray-400 py-1">+{artists.length - 4}명</span>
                  )}
                </div>
              ) : (
                <span className="text-sm text-gray-400">아티스트 없음</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setCreditEditorOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex-shrink-0"
            >
              <UsersIcon className="w-4 h-4 text-gray-500" />
              크레딧 편집
            </button>
          </div>
        </Field>

        {/* 앨범 */}
        <Field label="앨범">
          <div className="flex items-center gap-3">
            {album ? (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {album.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={album.image} alt={album.name} className="w-8 h-8 rounded object-cover flex-shrink-0" />
                )}
                <span className="text-sm text-gray-800 truncate">{album.name}</span>
                <button
                  type="button"
                  onClick={() => { setAlbum(null); setItunesAlbumFull(null); }}
                  className="ml-auto text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <span className="text-sm text-gray-400 flex-1">앨범 없음</span>
            )}
            <button
              type="button"
              onClick={() => setAlbumSearchOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex-shrink-0"
            >
              <DiscIcon className="w-4 h-4 text-gray-500" />
              {album ? "변경" : "앨범 검색"}
            </button>
          </div>
        </Field>

        {/* 발매일 */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">발매일</label>
          <div className="flex gap-2">
            <input value={year} onChange={(e) => setYear(e.target.value)} placeholder="년도" className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <input value={month} onChange={(e) => setMonth(e.target.value)} placeholder="월" className="w-16 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <input value={day} onChange={(e) => setDay(e.target.value)} placeholder="일" className="w-16 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        {/* 태그 */}
        <Field label="태그">
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              {tags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((t) => (
                    <span key={t.id} className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 rounded-full px-2.5 py-1 font-medium">
                      {t.name}
                      <button type="button" onClick={() => setTags(tags.filter((x) => x.id !== t.id))} className="hover:text-indigo-900">
                        <XIcon className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-sm text-gray-400">태그 없음</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setTagSelectOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex-shrink-0"
            >
              <TagsIcon className="w-4 h-4 text-gray-500" />
              태그 설정
            </button>
          </div>
        </Field>

        <LinkFields
          links={links}
          onChange={(key, val) => setLinks((prev) => ({ ...prev, [key]: val }))}
          defs={TRACK_ALBUM_LINK_DEFS}
        />

        {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {isPending ? "저장 중…" : "저장"}
          </button>
        </div>
      </form>

      <ImageUploadModal
        open={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        onComplete={(url) => setImage(url)}
        crop={{ aspect: 1 }}
        category="tracks"
      />
      <CreditEditor
        open={creditEditorOpen}
        onClose={() => setCreditEditorOpen(false)}
        value={artists}
        onChange={setArtists}
      />
      <AlbumSearchModal
        open={albumSearchOpen}
        onClose={() => setAlbumSearchOpen(false)}
        onSelect={(a) => { setAlbum(a); setItunesAlbumFull(null); }}
      />
      <TagSelectModal
        open={tagSelectOpen}
        onClose={() => setTagSelectOpen(false)}
        value={tags}
        onChange={setTags}
      />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";
