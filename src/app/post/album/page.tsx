"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StarIcon, ImageIcon, XIcon, UsersIcon, TagsIcon, TrashIcon, PlusIcon, GripVerticalIcon } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ItunesSearch } from "@/components/post/ItunesSearch";
import { CreditEditor } from "@/components/post/CreditEditor";
import { TagSelectModal } from "@/components/post/TagSelectModal";
import { TrackSearchModal } from "@/components/post/TrackSearchModal";
import { ImageUploadModal } from "@/components/ui/ImageUploadModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { LinkFields, TRACK_ALBUM_LINK_DEFS } from "@/components/post/LinkFields";
import { ArtistCreditDisplay } from "@/components/music/ArtistCreditDisplay";
import { Badge } from "@/components/ui/Badge";
import { PlatformLinks } from "@/components/ui/PlatformLinks";
import { formatPublishedDate } from "@/lib/utils";
import { saveAlbum, type TrackInput } from "@/app/actions/save";
import {
  itunesSearchAlbums,
  itunesLookupAlbumTracks,
  artworkHQ,
  parseItunesDate,
  type ItunesAlbum,
} from "@/lib/itunes";
import type { SelectedArtist } from "@/components/post/ArtistRolePicker";
import type { ArtistCredit, ArtistRole, SelectedTrack } from "@/types";
import type { SelectedTag } from "@/components/post/TagPicker";

interface TrackItem {
  uid: string;
  id: string | null;
  name: string;
  image: string | null;
  artistDisplay: string;
  trackNumber?: number;
  itunesTrackId?: string;
  itunesArtistId?: string;
  appleMusicUrl?: string | null;
  publishedYear?: number;
  publishedMonth?: number;
  publishedDay?: number;
}

function SortableTrackRow({
  track,
  index,
  onRemove,
}: {
  track: TrackItem;
  index: number;
  onRemove: (uid: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: track.uid });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  return (
    <tr ref={setNodeRef} style={style} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
      <td className="pl-3 py-2.5 w-8">
        <button type="button" {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-0.5 text-gray-300 hover:text-gray-500 transition-colors touch-none" tabIndex={-1}>
          <GripVerticalIcon className="w-4 h-4" />
        </button>
      </td>
      <td className="pr-3 py-2.5 w-8 text-right text-xs text-gray-400 tabular-nums">{index + 1}</td>
      <td className="pr-3 py-2.5 w-10">
        {track.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={track.image} alt={track.name} className="w-8 h-8 rounded object-cover" />
        ) : (
          <div className="w-8 h-8 rounded bg-gray-100" />
        )}
      </td>
      <td className="py-2.5 pr-4 min-w-0 max-w-0 w-2/5">
        <span className="text-sm text-gray-900 truncate block">{track.name}</span>
      </td>
      <td className="py-2.5 pr-4 min-w-0 max-w-0">
        <span className="text-sm text-gray-500 truncate block">{track.artistDisplay}</span>
      </td>
      <td className="pr-3 py-2.5 w-10 text-right">
        <button type="button" onClick={() => onRemove(track.uid)} className="p-1 text-gray-300 hover:text-red-500 transition-colors">
          <XIcon className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
}

let uidCounter = 0;
function nextUid() { return `track-${++uidCounter}`; }

export default function PostAlbumPage() {
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
  const [tracks, setTracks] = useState<TrackItem[]>([]);
  const [itunesAlbumId, setItunesAlbumId] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);

  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [creditEditorOpen, setCreditEditorOpen] = useState(false);
  const [tagSelectOpen, setTagSelectOpen] = useState(false);
  const [trackSearchOpen, setTrackSearchOpen] = useState(false);
  const [removePending, setRemovePending] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

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

  async function onItunesAlbumSelect(album: ItunesAlbum) {
    const date = parseItunesDate(album.releaseDate);
    setName(album.collectionName);
    setImage(artworkHQ(album.artworkUrl100));
    setYear(String(date.year));
    setMonth(String(date.month));
    setDay(String(date.day));
    setItunesAlbumId(String(album.collectionId));
    setLinks((prev) => ({ ...prev, appleMusicUrl: album.collectionViewUrl }));
    setArtists([{ id: null, itunesArtistId: String(album.artistId), appleMusicUrl: album.artistViewUrl, name: album.artistName, role: "MAIN", showInOverview: true }]);

    setTracks([]);
    const { tracks: itTracks } = await itunesLookupAlbumTracks(album.collectionId);
    if (itTracks.length > 0) {
      setTracks(itTracks.map((t) => {
        const td = parseItunesDate(t.releaseDate);
        return {
          uid: nextUid(),
          id: null,
          name: t.trackName,
          image: artworkHQ(t.artworkUrl100),
          artistDisplay: album.artistName,
          trackNumber: t.trackNumber,
          itunesTrackId: String(t.trackId),
          itunesArtistId: String(album.artistId),
          appleMusicUrl: t.trackViewUrl,
          publishedYear: td.year,
          publishedMonth: td.month,
          publishedDay: td.day,
        };
      }));
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setTracks((items) => {
      const oldIndex = items.findIndex((t) => t.uid === active.id);
      const newIndex = items.findIndex((t) => t.uid === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
  }

  function handleTrackAdd(selected: SelectedTrack) {
    const uid = selected.id ?? nextUid();
    if (tracks.some((t) => selected.id ? t.id === selected.id : t.itunesTrackId === selected.itunesTrackId)) return;
    setTracks((prev) => [...prev, {
      uid,
      id: selected.id,
      name: selected.name,
      image: selected.image,
      artistDisplay: selected.artistDisplay,
      itunesTrackId: selected.itunesTrackId,
      itunesArtistId: selected.itunesArtistId,
      appleMusicUrl: selected.appleMusicUrl,
    }]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("제목을 입력하세요."); return; }
    if (artists.length === 0) { setError("아티스트를 추가하세요."); return; }
    setError(null);

    startTransition(async () => {
      const itunesTracks: TrackInput[] = tracks
        .filter((t) => t.id === null)
        .map((t, _i) => {
          const pos = tracks.indexOf(t);
          return {
            itunesTrackId: t.itunesTrackId,
            name: t.name,
            trackNumber: pos + 1,
            image: t.image,
            appleMusicUrl: t.appleMusicUrl ?? null,
            publishedYear: t.publishedYear ?? null,
            publishedMonth: t.publishedMonth ?? null,
            publishedDay: t.publishedDay ?? null,
          };
        });

      const existingTracks = tracks
        .filter((t) => t.id !== null)
        .map((t) => ({ id: t.id!, trackNumber: tracks.indexOf(t) + 1 }));

      const result = await saveAlbum({
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
        itunesAlbumId,
        artists: artists.map((a) => ({
          id: a.id ?? undefined,
          itunesArtistId: a.itunesArtistId,
          name: a.name,
          image: a.image,
          appleMusicUrl: a.appleMusicUrl,
          role: a.role,
        })),
        tracks: itunesTracks,
        existingTracks,
        tagIds: tags.map((t) => t.id),
      });

      if (result.ok && result.id) {
        router.push(`/albums/${result.id}`);
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
            {displayDate && <p className="text-sm text-white/55 mt-1">{displayDate}</p>}
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

      {/* iTunes 앨범 검색 */}
      <ItunesSearch<ItunesAlbum>
        placeholder="iTunes에서 앨범 검색…"
        onSearch={itunesSearchAlbums}
        renderResult={(a) => (
          <div className="flex items-center gap-3 px-3 py-2.5">
            {a.artworkUrl100 && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={a.artworkUrl100} alt="" className="w-9 h-9 rounded object-cover flex-shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{a.collectionName}</p>
              <p className="text-xs text-gray-500 truncate">{a.artistName} · {new Date(a.releaseDate).getUTCFullYear()}</p>
            </div>
          </div>
        )}
        onSelect={onItunesAlbumSelect}
      />

      {/* 편집 폼 */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
        <h2 className="text-lg font-bold text-gray-900">앨범 추가</h2>

        <Field label="제목 *">
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="앨범 제목" />
        </Field>

        <Field label="별명 (쉼표로 구분)">
          <input value={aliases} onChange={(e) => setAliases(e.target.value)} className={inputCls} placeholder="대체 제목1, Alternative Title" />
        </Field>

        <Field label="커버 이미지">
          <div className="flex items-center gap-3">
            {image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="cover" className="w-14 h-14 rounded-lg object-cover border border-gray-100 flex-shrink-0" />
            )}
            <div className="flex gap-2">
              <button type="button" onClick={() => setImageModalOpen(true)} className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <ImageIcon className="w-4 h-4 text-gray-500" />
                {image ? "수정" : "이미지 추가"}
              </button>
              {image && (
                <button type="button" onClick={() => setImage(null)} className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors">
                  <TrashIcon className="w-4 h-4" />
                  제거
                </button>
              )}
            </div>
          </div>
        </Field>

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
                  {artists.length > 4 && <span className="text-xs text-gray-400 py-1">+{artists.length - 4}명</span>}
                </div>
              ) : (
                <span className="text-sm text-gray-400">아티스트 없음</span>
              )}
            </div>
            <button type="button" onClick={() => setCreditEditorOpen(true)} className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex-shrink-0">
              <UsersIcon className="w-4 h-4 text-gray-500" />
              크레딧 편집
            </button>
          </div>
        </Field>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">발매일</label>
          <div className="flex gap-2">
            <input value={year} onChange={(e) => setYear(e.target.value)} placeholder="년도" className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <input value={month} onChange={(e) => setMonth(e.target.value)} placeholder="월" className="w-16 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <input value={day} onChange={(e) => setDay(e.target.value)} placeholder="일" className="w-16 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

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
            <button type="button" onClick={() => setTagSelectOpen(true)} className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex-shrink-0">
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

        {/* 트랙 목록 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">트랙 목록</label>
            <button type="button" onClick={() => setTrackSearchOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <PlusIcon className="w-4 h-4 text-gray-500" />
              트랙 추가
            </button>
          </div>

          {tracks.length > 0 ? (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={tracks.map((t) => t.uid)} strategy={verticalListSortingStrategy}>
                  <table className="w-full">
                    <tbody>
                      {tracks.map((track, i) => (
                        <SortableTrackRow
                          key={track.uid}
                          track={track}
                          index={i}
                          onRemove={(uid) => setRemovePending(uid)}
                        />
                      ))}
                    </tbody>
                  </table>
                </SortableContext>
              </DndContext>
            </div>
          ) : (
            <div className="border border-dashed border-gray-200 rounded-lg py-6 text-center text-sm text-gray-400">
              iTunes에서 앨범을 선택하거나 트랙을 직접 추가하세요
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.back()} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">취소</button>
          <button type="submit" disabled={isPending} className="px-6 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {isPending ? "저장 중…" : "저장"}
          </button>
        </div>
      </form>

      <ImageUploadModal
        open={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        onComplete={(url) => setImage(url)}
        crop={{ aspect: 1 }}
        category="albums"
      />
      <CreditEditor
        open={creditEditorOpen}
        onClose={() => setCreditEditorOpen(false)}
        value={artists}
        onChange={setArtists}
      />
      <TagSelectModal
        open={tagSelectOpen}
        onClose={() => setTagSelectOpen(false)}
        value={tags}
        onChange={setTags}
      />
      <TrackSearchModal
        open={trackSearchOpen}
        onClose={() => setTrackSearchOpen(false)}
        onSelect={handleTrackAdd}
      />
      <ConfirmModal
        open={removePending !== null}
        title="트랙을 목록에서 제거하시겠습니까?"
        description="트랙 레코드는 삭제되지 않으며, 이 앨범과의 연결만 해제됩니다."
        confirmLabel="제거"
        danger
        onConfirm={() => {
          if (removePending) setTracks((prev) => prev.filter((t) => t.uid !== removePending));
          setRemovePending(null);
        }}
        onCancel={() => setRemovePending(null)}
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
