"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { deleteArtist } from "@/app/actions/content";

interface Props {
  artistId: string;
}

export function ArtistActions({ artistId }: Props) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleDeleteConfirm() {
    setDeleteOpen(false);
    startTransition(async () => {
      await deleteArtist(artistId);
    });
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Link
          href={`/artists/${artistId}/edit`}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-white/30 text-white/80 rounded-lg hover:bg-white/10 transition-colors"
        >
          <PencilIcon className="w-3.5 h-3.5" />
          수정
        </Link>
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          disabled={pending}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-red-400/40 text-red-300 rounded-lg hover:bg-red-900/30 transition-colors disabled:opacity-50"
        >
          <Trash2Icon className="w-3.5 h-3.5" />
          삭제
        </button>
      </div>

      <ConfirmModal
        open={deleteOpen}
        title="아티스트를 삭제하시겠습니까?"
        description="삭제한 아티스트는 복구할 수 없습니다."
        confirmLabel="삭제"
        danger
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteOpen(false)}
      />
    </>
  );
}
