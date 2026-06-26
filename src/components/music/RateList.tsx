import Image from "next/image";
import Link from "next/link";
import { formatScore } from "@/lib/utils";
import { StarRating } from "@/components/ui/StarRating";

interface RateEntry {
  id: string;
  score: number | null;
  comment: string | null;
  starred: boolean;
  updatedAt: Date;
  user: { id: string; name: string | null; image: string | null };
}

interface RateListProps {
  rates: RateEntry[];
  currentUserId?: string;
}

export function RateList({ rates, currentUserId }: RateListProps) {
  const displayed = rates.filter((r) => r.score != null || r.comment);

  if (displayed.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900">리뷰 ({displayed.length})</h2>
      {displayed.map((rate) => (
        <div
          key={rate.id}
          className={`bg-white rounded-2xl border p-5 ${
            rate.user.id === currentUserId ? "border-indigo-200 ring-1 ring-indigo-200" : "border-gray-100"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link href={`/user/${rate.user.id}`}>
                {rate.user.image ? (
                  <Image
                    src={rate.user.image}
                    alt={rate.user.name ?? "User"}
                    width={36}
                    height={36}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                    {rate.user.name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                )}
              </Link>
              <div>
                <Link
                  href={`/user/${rate.user.id}`}
                  className="font-semibold text-sm text-gray-900 hover:text-indigo-600"
                >
                  {rate.user.name ?? "Unknown"}
                </Link>
                <p className="text-xs text-gray-400">
                  {new Date(rate.updatedAt).toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>

            {/* 평점 영역: starred면 컬러, 아니면 회색 */}
            {rate.score != null && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className={rate.starred ? "" : "grayscale opacity-50"}>
                  <StarRating value={rate.score} readonly size="sm" />
                </div>
                <span
                  className={`font-bold text-sm tabular-nums ${
                    rate.starred ? "text-indigo-600" : "text-gray-400"
                  }`}
                >
                  {formatScore(rate.score)}
                </span>
              </div>
            )}
          </div>

          {rate.comment && (
            <p className="mt-3 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {rate.comment}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
