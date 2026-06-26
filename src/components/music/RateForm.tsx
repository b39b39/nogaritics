"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { StarRating } from "@/components/ui/StarRating";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { submitRate } from "@/app/actions/rate";
import { formatScore } from "@/lib/utils";

interface RateFormProps {
  targetId: string;
  targetType: "track" | "album";
  existingRate: {
    score: number | null;
    comment: string | null;
    starred: boolean;
  } | null;
}

export function RateForm({ targetId, targetType, existingRate }: RateFormProps) {
  const hasReview = existingRate != null && (existingRate.score != null || !!existingRate.comment);

  const [editMode, setEditMode] = useState(!hasReview);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [scoreInput, setScoreInput] = useState(
    existingRate?.score != null ? existingRate.score.toFixed(2) : ""
  );
  const [comment, setComment] = useState(existingRate?.comment ?? "");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const parsedScore = scoreInput !== "" ? parseFloat(scoreInput) : null;
  const previewScore =
    parsedScore != null && !isNaN(parsedScore)
      ? Math.min(5, Math.max(0, parsedScore))
      : null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (parsedScore != null && (parsedScore < 0 || parsedScore > 5)) return;
    startTransition(async () => {
      const result = await submitRate({
        targetId,
        targetType,
        score: parsedScore,
        comment: comment.trim() || null,
        starred: existingRate?.starred ?? false,
      });
      if (result.ok) {
        setEditMode(false);
        router.refresh();
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await submitRate({
        targetId,
        targetType,
        score: null,
        comment: null,
        starred: false,
        _delete: true,
      });
      if (result.ok) router.refresh();
    });
  }

  function handleCancelEdit() {
    setScoreInput(existingRate?.score != null ? existingRate.score.toFixed(2) : "");
    setComment(existingRate?.comment ?? "");
    setEditMode(false);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <h2 className="text-lg font-bold text-gray-900 flex-shrink-0">나의 리뷰</h2>
          {!editMode && hasReview && existingRate!.score != null && (
            <>
              <StarRating value={existingRate!.score} readonly size="sm" />
              <span className="font-bold text-indigo-600 tabular-nums">
                {formatScore(existingRate!.score)}
              </span>
            </>
          )}
        </div>
        {hasReview && !editMode && (
          <div className="flex gap-1.5 flex-shrink-0">
            <button
              onClick={() => { setEditMode(true); }}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-600"
            >
              <PencilIcon className="w-3.5 h-3.5" />
              수정
            </button>
            <button
              onClick={() => setDeleteOpen(true)}
              disabled={isPending}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <Trash2Icon className="w-3.5 h-3.5" />
              삭제
            </button>
          </div>
        )}
        {editMode && hasReview && (
          <button
            onClick={handleCancelEdit}
            className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-500"
          >
            취소
          </button>
        )}
      </div>

      {/* 뷰 모드 — 코멘트만 */}
      {!editMode && hasReview && existingRate!.comment && (
        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
          {existingRate!.comment}
        </p>
      )}

      {/* 편집/작성 모드 */}
      {editMode && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              점수{" "}
              <span className="text-gray-400 font-normal text-xs">(0.00 – 5.00)</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0"
                max="5"
                step="0.01"
                value={scoreInput}
                onChange={(e) => setScoreInput(e.target.value)}
                placeholder="예: 4.25"
                className="w-28 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 tabular-nums"
              />
              {previewScore != null && (
                <StarRating value={previewScore} readonly size="md" />
              )}
              {scoreInput && (
                <button
                  type="button"
                  onClick={() => setScoreInput("")}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  지우기
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">코멘트 (선택)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="감상을 적어주세요…"
              rows={4}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {isPending ? "저장 중…" : hasReview ? "저장" : "등록"}
          </button>
        </form>
      )}

      <ConfirmModal
        open={deleteOpen}
        title="리뷰를 삭제하시겠습니까?"
        confirmLabel="삭제"
        danger
        onConfirm={() => { setDeleteOpen(false); handleDelete(); }}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
