"use client";

import { useState, useTransition } from "react";
import { StarIcon, PencilIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { toggleStarred } from "@/app/actions/rate";
import { deleteAlbum } from "@/app/actions/content";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

interface Props {
  albumId: string;
  canEdit: boolean;
  initialStarred: boolean;
  isLoggedIn: boolean;
}

export function AlbumActions({ albumId, canEdit, initialStarred, isLoggedIn }: Props) {
  const [starred, setStarred] = useState(initialStarred);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [starPending, startStarTransition] = useTransition();
  const [deletePending, startDeleteTransition] = useTransition();

  function handleStar() {
    if (!isLoggedIn || starPending) return;
    const next = !starred;
    setStarred(next);
    startStarTransition(async () => {
      await toggleStarred(albumId, "album", next);
    });
  }

  function handleDeleteConfirm() {
    setDeleteOpen(false);
    startDeleteTransition(async () => {
      await deleteAlbum(albumId);
    });
  }

  return (
    <div className="flex flex-col items-end justify-between flex-shrink-0 self-stretch">
      <button
        onClick={handleStar}
        disabled={!isLoggedIn || starPending}
        title={!isLoggedIn ? "로그인이 필요합니다" : starred ? "스타 취소" : "스타 추가"}
        className={`p-1.5 rounded-lg transition-colors ${
          !isLoggedIn ? "opacity-50 cursor-default" : "hover:bg-white/10"
        }`}
      >
        <StarIcon
          className={`w-6 h-6 transition-colors ${
            starred ? "fill-yellow-400 text-yellow-400" : "fill-none text-white/70 stroke-[1.5]"
          }`}
        />
      </button>

      {canEdit && (
        <div className="flex gap-2">
          <Link
            href={`/albums/${albumId}/edit`}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-white/30 text-white/80 rounded-lg hover:bg-white/10 transition-colors"
          >
            <PencilIcon className="w-3.5 h-3.5" />
            수정
          </Link>
          <button
            onClick={() => setDeleteOpen(true)}
            disabled={deletePending}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-red-400/40 text-red-300 rounded-lg hover:bg-red-900/30 transition-colors disabled:opacity-50"
          >
            <Trash2Icon className="w-3.5 h-3.5" />
            삭제
          </button>
        </div>
      )}

      <ConfirmModal
        open={deleteOpen}
        title="앨범을 삭제하시겠습니까?"
        description="삭제한 앨범은 복구할 수 없습니다."
        confirmLabel="삭제"
        danger
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
